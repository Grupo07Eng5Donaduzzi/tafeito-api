import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from '@shared/shared.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PaymentAuthGuard } from './infra/guards/payment-auth.guard';

@Module({
  imports: [SharedModule, PaymentModule],
  providers: [{ provide: APP_GUARD, useClass: PaymentAuthGuard }],
})
export class AppModule {}
