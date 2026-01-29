import { Controller, Post, Get, Body, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  create(@GetUser() user: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.id, dto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  toggleStatus(@Param('id') id: string, @GetUser() user: any) {
    return this.productsService.toggleStatus(id, user.id);
  }

  @Get('my/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  getMyInventory(@GetUser() user: any) {
    return this.productsService.findByStore(user.id);
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  update(@Param('id') id: string, @GetUser() user: any, @Body() dto: any) {
    return this.productsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STORE)
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.productsService.delete(id, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
