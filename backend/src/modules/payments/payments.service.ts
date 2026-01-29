import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  // Имитируем создание платежа
  async createPayment(amount: number, orderId: string) {
    const paymentId = uuidv4();
    // Убедись, что FRONTEND_URL в .env без лишних слешей в конце
    const baseUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
    
    return {
      id: paymentId,
      status: 'pending',
      confirmation: {
        type: 'redirect',
        confirmation_url: `${baseUrl}/payment-simulator?orderId=${orderId}&amount=${amount}`,
      },
    };
  }
}