import { Module } from '@nestjs/common';
import { PaymentsController } from './infra/controllers/payments.controller';
import { PaymentsService } from './application/services/payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
