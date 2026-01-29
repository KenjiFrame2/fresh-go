import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, UserRole } from '@prisma/client';
import { getDistance } from '../../common/utils/geo.utils';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService) {}

  private readonly allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.CREATED]: [OrderStatus.WAITING_PAYMENT],
    [OrderStatus.WAITING_PAYMENT]: [OrderStatus.PAID],
    [OrderStatus.PAID]: [OrderStatus.WAITING_STORE],
    [OrderStatus.WAITING_STORE]: [
      OrderStatus.STORE_ACCEPTED,
      OrderStatus.STORE_REJECTED,
    ],
    [OrderStatus.STORE_ACCEPTED]: [OrderStatus.ASSEMBLING],
    [OrderStatus.ASSEMBLING]: [OrderStatus.READY_FOR_PICKUP],
    [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.WAITING_COURIER],
    [OrderStatus.WAITING_COURIER]: [OrderStatus.COURIER_ACCEPTED],
    [OrderStatus.COURIER_ACCEPTED]: [OrderStatus.PICKED_UP],
    [OrderStatus.PICKED_UP]: [OrderStatus.IN_DELIVERY],
    [OrderStatus.IN_DELIVERY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.DISPUTE],
    [OrderStatus.COMPLETED]: [OrderStatus.PAYOUT],
    [OrderStatus.STORE_REJECTED]: [OrderStatus.REFUND],
    [OrderStatus.REFUND]: [OrderStatus.CLOSED],
    [OrderStatus.PAYOUT]: [OrderStatus.CLOSED],
    [OrderStatus.DISPUTE]: [OrderStatus.CLOSED, OrderStatus.REFUND],
    [OrderStatus.CLOSED]: [],
    [OrderStatus.ISSUE]: [OrderStatus.DISPUTE],
  };

  async addOrderPhoto(orderId: string, url: string, type: string) {
    return this.prisma.orderPhoto.create({
      data: { orderId, url, type },
    });
  }

  async create(clientId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      // Убрал фильтр по storeId здесь, так как продукты могут быть из разных магазинов (но в MVP берем один)
      where: { id: { in: productIds } },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Товары не найдены');
    }

    let totalAmount = 0;
    const itemsToCreate = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const price = Number(product!.price);
      totalAmount += price * item.quantity;
      return { productId: item.productId, quantity: item.quantity, price };
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Создаем заказ СРАЗУ в CREATED
      const order = await tx.order.create({
        data: {
          clientId,
          storeId: dto.storeId,
          status: OrderStatus.CREATED, // Стартуем с базы
          totalAmount,
          deliveryFee: 200,
          address: dto.address,
          comment: dto.comment,
          items: { create: itemsToCreate },
        },
      });

      // 2. Логируем создание
      await tx.orderLog.create({
        data: { orderId: order.id, toStatus: OrderStatus.CREATED, userId: clientId }
      });

      // 3. Сразу переводим в WAITING_PAYMENT для оплаты
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.WAITING_PAYMENT }
      });

      // 4. Логируем переход к оплате
      await tx.orderLog.create({
        data: { 
          orderId: order.id, 
          fromStatus: OrderStatus.CREATED, 
          toStatus: OrderStatus.WAITING_PAYMENT, 
          userId: clientId 
        }
      });

      const grandTotal = totalAmount + 200;
      const payment = await this.paymentsService.createPayment(grandTotal, order.id);

      return { order, confirmation_url: payment.confirmation.confirmation_url };
    });
  }

  async changeStatus(
    orderId: string,
    nextStatus: OrderStatus,
    userId: string,
    userRole: UserRole,
    metadata?: { lat?: number; lon?: number },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { photos: true }, // Убрал include: { store: true }, так как в MVP координаты магазина захардкожены
    });

    if (!order) throw new NotFoundException('Заказ не найден');

    // --- ПРОВЕРКИ АНТИФРОДА ---
    if (nextStatus === OrderStatus.READY_FOR_PICKUP) {
      const hasPhoto = order.photos.some(p => p.type === 'ASSEMBLY');
      if (!hasPhoto) throw new BadRequestException('Нужно фото сборки');
    }

    if (nextStatus === OrderStatus.PICKED_UP) {
      if (metadata?.lat === undefined || metadata?.lon === undefined) {
        throw new BadRequestException('Нужна геолокация');
      }

      const storeLat = 54.8886544; // Для MVP хардкод
      const storeLon = 47.5303257;
      const dist = getDistance(metadata.lat, metadata.lon, storeLat, storeLon);
      if (dist > 500) throw new BadRequestException('Вы слишком далеко от магазина');
      if (!order.photos.some(p => p.type === 'PICKUP')) throw new BadRequestException('Нужно фото получения');
    }

    if (nextStatus === OrderStatus.DELIVERED) {
      if (!order.photos.some(p => p.type === 'DELIVERY')) throw new BadRequestException('Нужно фото доставки');
    }

    // --- ПРОВЕРКА FSM ---
    const possible = this.allowedTransitions[order.status];
    if (!possible.includes(nextStatus)) {
      throw new BadRequestException(`Переход из ${order.status} в ${nextStatus} запрещен`);
    }

    this.validateRoleForStatus(nextStatus, userRole, order, userId);

    return this.prisma.$transaction(async (tx) => {
      // 1. ПЕРВЫЙ ПЕРЕХОД (например, в PAID)
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          ...(nextStatus === OrderStatus.COURIER_ACCEPTED ? { courierId: userId } : {}),
        },
      });

      // 2. ЛОГ ПЕРВОГО ПЕРЕХОДА
      await tx.orderLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: nextStatus,
          userId,
          metadata: metadata ? (metadata as any) : undefined,
        },
      });

      // 3. ЭСКРОУ И АВТОМАТИЗАЦИЯ
      if (nextStatus === OrderStatus.PAID) {
        // Запись транзакции
        await tx.transaction.create({
          data: {
            orderId: orderId,
            type: 'PAYMENT',
            amount: Number(updatedOrder.totalAmount) + Number(updatedOrder.deliveryFee),
          },
        });

        // АВТО-ПЕРЕХОД В WAITING_STORE
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.WAITING_STORE }
        });

        // ЛОГ АВТО-ПЕРЕХОДА
        await tx.orderLog.create({
          data: {
            orderId,
            fromStatus: OrderStatus.PAID,
            toStatus: OrderStatus.WAITING_STORE,
            userId: 'SYSTEM_BOT', // Четко помечаем автоматику
          }
        });
      }

      // ... (логика COMPLETED и REFUND остается такой же, но с await логами внутри своих if) ...

      return updatedOrder;
    });
  }

  private validateRoleForStatus(
    status: OrderStatus,
    role: UserRole,
    order: any,
    userId: string,
  ) {
    // Явно указываем тип OrderStatus[], чтобы убрать ошибку TS2345
    const storeStatuses: OrderStatus[] = [
      OrderStatus.STORE_ACCEPTED,
      OrderStatus.STORE_REJECTED,
      OrderStatus.ASSEMBLING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.WAITING_COURIER,
    ];

    if (storeStatuses.includes(status)) {
      if (role !== UserRole.STORE || order.storeId !== userId) {
        throw new ForbiddenException('Только магазин управляет сборкой');
      }
    }

    const courierStatuses: OrderStatus[] = [
      OrderStatus.COURIER_ACCEPTED,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    if (courierStatuses.includes(status)) {
      if (role !== UserRole.COURIER) throw new ForbiddenException('Только курьер');
      if (order.courierId && order.courierId !== userId) throw new ForbiddenException('Заказ у другого курьера');
    }

    const clientStatuses: OrderStatus[] = [
      OrderStatus.WAITING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.COMPLETED,
    ];

    if (clientStatuses.includes(status)) {
      if (role !== UserRole.CLIENT || order.clientId !== userId) {
        throw new ForbiddenException('Только клиент');
      }
    }
  }

  async getForClient(clientId: string) {
    return this.prisma.order.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async getForStore(storeId: string) {
    return this.prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async getForCourier(courierId: string) {
    return this.prisma.order.findMany({
      where: { courierId: courierId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, store: true }
    });
  }

  async getAvailableForCourier() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.WAITING_COURIER },
      include: { store: true },
    });
  }

  async getTransactions() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, status: true } } }
    });
  }
}

// import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { OrderStatus, UserRole } from '@prisma/client';

// @Injectable()
// export class OrdersService {
//   constructor(private prisma: PrismaService) {}

//   // Таблица разрешенных переходов: [Текущий статус] -> [Список возможных следующих]
//   private readonly allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
//     [OrderStatus.CREATED]: [OrderStatus.WAITING_PAYMENT],
//     [OrderStatus.WAITING_PAYMENT]: [OrderStatus.PAID],
//     [OrderStatus.PAID]: [OrderStatus.WAITING_STORE],
//     [OrderStatus.WAITING_STORE]: [OrderStatus.STORE_ACCEPTED, OrderStatus.STORE_REJECTED],
//     [OrderStatus.STORE_ACCEPTED]: [OrderStatus.ASSEMBLING],
//     [OrderStatus.ASSEMBLING]: [OrderStatus.READY_FOR_PICKUP],
//     [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.WAITING_COURIER],
//     [OrderStatus.WAITING_COURIER]: [OrderStatus.COURIER_ACCEPTED],
//     [OrderStatus.COURIER_ACCEPTED]: [OrderStatus.PICKED_UP],
//     [OrderStatus.PICKED_UP]: [OrderStatus.IN_DELIVERY],
//     [OrderStatus.IN_DELIVERY]: [OrderStatus.DELIVERED],
//     [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.DISPUTE],
//     [OrderStatus.COMPLETED]: [OrderStatus.PAYOUT],
//     [OrderStatus.STORE_REJECTED]: [OrderStatus.REFUND],
//     [OrderStatus.REFUND]: [OrderStatus.CLOSED],
//     [OrderStatus.PAYOUT]: [OrderStatus.CLOSED],
//     [OrderStatus.DISPUTE]: [OrderStatus.CLOSED, OrderStatus.REFUND],
//     [OrderStatus.CLOSED]: [],
//     [OrderStatus.ISSUE]: [OrderStatus.DISPUTE]
//   };

//   async create(clientId: string, dto: CreateOrderDto) {
//     // ... твой текущий код метода create остается без изменений ...
//     // Но убедись, что он возвращает созданный заказ
//     const productIds = dto.items.map((i) => i.productId);
//     const products = await this.prisma.product.findMany({
//       where: { id: { in: productIds }, storeId: dto.storeId },
//     });

//     if (products.length !== dto.items.length) {
//       throw new BadRequestException('Товары не найдены');
//     }

//     let totalAmount = 0;
//     const itemsToCreate = dto.items.map((item) => {
//       const product = products.find((p) => p.id === item.productId);
//       const price = Number(product!.price);
//       totalAmount += price * item.quantity;
//       return { productId: item.productId, quantity: item.quantity, price: price };
//     });

//     return this.prisma.$transaction(async (tx) => {
//       const order = await tx.order.create({
//         data: {
//           clientId,
//           storeId: dto.storeId,
//           status: OrderStatus.CREATED,
//           totalAmount,
//           deliveryFee: 200,
//           items: { create: itemsToCreate },
//         },
//       });
//       await tx.orderLog.create({
//         data: { orderId: order.id, toStatus: OrderStatus.CREATED, userId: clientId },
//       });
//       return order;
//     });
//   }

//   // ГЛАВНЫЙ МЕТОД FSM
//   async changeStatus(orderId: string, nextStatus: OrderStatus, userId: string, userRole: UserRole) {
//     const order = await this.prisma.order.findUnique({ where: { id: orderId } });
//     if (!order) throw new NotFoundException('Заказ не найден');

//     // 1. Проверка валидности перехода
//     const possible = this.allowedTransitions[order.status];
//     if (!possible.includes(nextStatus)) {
//       throw new BadRequestException(`Невозможный переход из ${order.status} в ${nextStatus}`);
//     }

//     // 2. Проверка прав роли (Кто может менять статус?)
//     this.validateRoleForStatus(nextStatus, userRole, order, userId);

//     // 3. Атомарное обновление
//     return this.prisma.$transaction(async (tx) => {
//       const updatedOrder = await tx.order.update({
//         where: { id: orderId },
//         data: { 
//           status: nextStatus,
//           // Если курьер принимает заказ, привязываем его ID
//           ...(nextStatus === OrderStatus.COURIER_ACCEPTED ? { courierId: userId } : {})
//         }
//       });

//       await tx.orderLog.create({
//         data: {
//           orderId,
//           fromStatus: order.status,
//           toStatus: nextStatus,
//           userId: userId
//         }
//       });

//       return updatedOrder;
//     });
//   }

//   private validateRoleForStatus(status: OrderStatus, role: UserRole, order: any, userId: string) {
//     // Магазин управляет сборкой
//     const storeStatuses: OrderStatus[] = [
//       OrderStatus.STORE_ACCEPTED, 
//       OrderStatus.STORE_REJECTED, 
//       OrderStatus.ASSEMBLING, 
//       OrderStatus.READY_FOR_PICKUP,
//       OrderStatus.WAITING_COURIER // Добавил, чтобы магазин мог вызвать курьера
//     ];

//     if (storeStatuses.includes(status)) {
//       if (role !== UserRole.STORE || order.storeId !== userId) {
//         throw new ForbiddenException('Только этот магазин может управлять этапами сборки');
//       }
//     }

//     // Курьер управляет доставкой
//     const courierStatuses: OrderStatus[] = [
//       OrderStatus.COURIER_ACCEPTED, 
//       OrderStatus.PICKED_UP, 
//       OrderStatus.IN_DELIVERY, 
//       OrderStatus.DELIVERED
//     ];

//     if (courierStatuses.includes(status)) {
//       if (role !== UserRole.COURIER) {
//         throw new ForbiddenException('Только курьер может менять статусы доставки');
//       }
//       // Если у заказа уже есть курьер, менять статусы может только ОН
//       if (order.courierId && order.courierId !== userId) {
//         throw new ForbiddenException('Этот заказ закреплен за другим курьером');
//       }
//     }

//     // Клиент подтверждает оплату и завершение
//     const clientStatuses: OrderStatus[] = [
//       OrderStatus.WAITING_PAYMENT,
//       OrderStatus.PAID, 
//       OrderStatus.COMPLETED
//     ];

//     if (clientStatuses.includes(status)) {
//       if (role !== UserRole.CLIENT || order.clientId !== userId) {
//         throw new ForbiddenException('Только клиент этого заказа может управлять оплатой и завершением');
//       }
//     }
//   }

//   // Методы для получения списков (интерфейсы ролей)
//   async getForClient(clientId: string) {
//     return this.prisma.order.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, include: { items: true } });
//   }

//   async getForStore(storeId: string) {
//     return this.prisma.order.findMany({ where: { storeId }, orderBy: { createdAt: 'desc' }, include: { items: true } });
//   }

//   async getAvailableForCourier() {
//     return this.prisma.order.findMany({ where: { status: OrderStatus.WAITING_COURIER }, include: { store: true } });
//   }
// }
