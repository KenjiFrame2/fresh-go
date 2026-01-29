import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(storeId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        description: dto.description,
        oldPrice: dto.oldPrice,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        storeId: storeId,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: { 
        category: true,
        store: { select: { fullName: true } } },
    });
  }

  async toggleStatus(productId: string, storeId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== storeId) {
      throw new ForbiddenException('Нет доступа к товару');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive }
    });
  }

  async findByStore(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { 
        category: true,
        store: { select: { id: true, fullName: true } } 
      }
    });
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }

  async update(id: string, storeId: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.storeId !== storeId) throw new ForbiddenException('вы не можете редактировать чужой товар');
    const { storeId: _, id: __, ...updateData } = dto;

    return this.prisma.product.update({ where: { id }, data: updateData });
  }

  async delete(id: string, storeId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.storeId !== storeId) throw new ForbiddenException();
    return this.prisma.product.delete({ where: { id } });
  }

  async getCategories() {
    return this.prisma.category.findMany();
  }
}
