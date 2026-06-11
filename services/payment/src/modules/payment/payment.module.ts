import { Module } from '@nestjs/common';
import { PaymentsService } from './application/services/payments.service';
import { PaymentMessagingService } from './application/services/payment-messaging.service';
import { ProposalEventConsumerService } from './application/services/proposal-event-consumer.service';
import { PaymentsController } from './infra/controllers/payments.controller';
import { DrizzlePaymentRecordRepository } from './infra/repositories/drizzle-payment-record.repository';
import { PAYMENT_RECORD_REPOSITORY } from './domain/repositories/payment-record-repository.interface';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentMessagingService,
    ProposalEventConsumerService,
    DrizzlePaymentRecordRepository,
    { provide: PAYMENT_RECORD_REPOSITORY, useExisting: DrizzlePaymentRecordRepository },
  ],
})
export class PaymentModule {}
