import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentsService } from '../payments/payments.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PaymentsService],
})
export class OrdersModule {}
