import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [SharedModule, PaymentModule],
})
export class AppModule {}
