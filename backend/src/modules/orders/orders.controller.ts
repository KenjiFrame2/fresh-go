import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserRole, OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@GetUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Post(':id/photos')
  @Roles(UserRole.STORE, UserRole.COURIER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    const url = `/uploads/${file.filename}`;
    return this.ordersService.addOrderPhoto(id, url, type);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; lat?: number; lon?: number },
    @GetUser() user: any,
  ) {
    return this.ordersService.changeStatus(
      id,
      body.status,
      user.id,
      user.role,
      { lat: body.lat, lon: body.lon },
    );
  }

  @Get('my/client')
  @Roles(UserRole.CLIENT)
  getForClient(@GetUser() user: any) {
    return this.ordersService.getForClient(user.id);
  }

  @Get('my/store')
  @Roles(UserRole.STORE)
  getForStore(@GetUser() user: any) {
    return this.ordersService.getForStore(user.id);
  }

  @Get('my/courier')
  @Roles(UserRole.COURIER)
  getForCourier(@GetUser() user: any) {
    return this.ordersService.getForCourier(user.id);
  }

  @Get('available/courier')
  @Roles(UserRole.COURIER)
  getAvailableForCourier() {
    return this.ordersService.getAvailableForCourier();
  }

  @Get('admin/transactions')
  @Roles(UserRole.ADMIN)
  getAllTransactions() {
    return this.ordersService.getTransactions();
  }
}
