import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findStores() {
    return this.prisma.user.findMany({
      where: { role: 'STORE' },
      select: {
        id: true,
        fullName: true,
        // Можно добавить поле "график работы" в модель User в Prisma позже
      }
    });
  }

  async findStoreInfo(id: string) {
    const store = await this.prisma.user.findUnique({
      where: { id, role: 'STORE' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        // В будущем добавим описание и адрес в модель User
      },
    });
    if (!store) throw new NotFoundException('Магазин не найден');
    return store;
  }

  async findPendingUsers() {
    return this.prisma.user.findMany({
      where: { isApproved: false },
      orderBy: { role: 'asc' }
    });
  }

  async approveUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });
  }

  async create(data: any) {
    return this.prisma.user.create({ data });
  }

  async updateRt(id: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }
}
