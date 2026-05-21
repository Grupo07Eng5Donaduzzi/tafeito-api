import { Module } from '@nestjs/common';
import { PaymentsController } from './infra/controllers/payments.controller';
import { PaymentsService } from './application/services/payments.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
