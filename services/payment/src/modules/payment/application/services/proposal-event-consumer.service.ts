import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  ProposalExchangeName,
  ProposalRoutingKey,
  ProposalAcceptedPayload,
  ProposalClientConfirmedPayload,
} from '@shared/contracts/events/proposal-events.enum';
import { PaymentsService } from './payments.service';
import { PaymentMessagingService } from './payment-messaging.service';
import type { PaymentRecordRepository } from '../../domain/repositories/payment-record-repository.interface';
import { PAYMENT_RECORD_REPOSITORY } from '../../domain/repositories/payment-record-repository.interface';

@Injectable()
export class ProposalEventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ProposalEventConsumerService.name);

  constructor(
    private readonly messagingService: SharedMessagingService,
    private readonly paymentsService: PaymentsService,
    private readonly paymentMessagingService: PaymentMessagingService,
    @Inject(PAYMENT_RECORD_REPOSITORY)
    private readonly paymentRecordRepository: PaymentRecordRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.consume(
      ProposalExchangeName.ACCEPTED,
      ProposalRoutingKey.ACCEPTED,
      'payment.proposal.accepted',
      (payload) => this.handleProposalAccepted(payload as ProposalAcceptedPayload),
    );

    await this.messagingService.consume(
      ProposalExchangeName.CLIENT_CONFIRMED,
      ProposalRoutingKey.CLIENT_CONFIRMED,
      'payment.proposal.client-confirmed',
      (payload) => this.handleProposalClientConfirmed(payload as ProposalClientConfirmedPayload),
    );
  }

  private async handleProposalAccepted(payload: ProposalAcceptedPayload): Promise<void> {
    this.logger.log(`Processing proposal.accepted for proposal ${payload.proposalId}`);

    const existing = await this.paymentRecordRepository.findByProposalId(payload.proposalId);
    if (existing) {
      this.logger.warn(`Payment already exists for proposal ${payload.proposalId}, republishing`);
      await this.paymentMessagingService.publishPaymentCreated({
        proposalId: payload.proposalId,
        paymentId: existing.asaasPaymentId,
        qrCode: existing.qrCode,
        qrCodeBase64: existing.qrCodeBase64,
        status: existing.status,
        ticketUrl: existing.ticketUrl,
      });
      return;
    }

    const pixPayment = await this.paymentsService.createPix({
      amount: payload.amount,
      payerEmail: payload.clientEmail,
      payerDocumentType: payload.clientDocumentType,
      payerDocumentNumber: payload.clientDocumentNumber,
    });

    await this.paymentRecordRepository.create({
      proposalId: payload.proposalId,
      asaasPaymentId: pixPayment.id,
      qrCode: pixPayment.qrCode,
      qrCodeBase64: pixPayment.qrCodeBase64,
      ticketUrl: pixPayment.ticketUrl,
      status: pixPayment.status,
      amount: payload.amount,
    });

    await this.paymentMessagingService.publishPaymentCreated({
      proposalId: payload.proposalId,
      paymentId: pixPayment.id,
      qrCode: pixPayment.qrCode,
      qrCodeBase64: pixPayment.qrCodeBase64,
      status: pixPayment.status,
      ticketUrl: pixPayment.ticketUrl,
    });

    this.logger.log(`PIX payment created for proposal ${payload.proposalId}`);
  }

  private async handleProposalClientConfirmed(payload: ProposalClientConfirmedPayload): Promise<void> {
    this.logger.log(`Processing proposal.client-confirmed for proposal ${payload.proposalId}`);

    try {
      await this.paymentsService.transferToPix(
        payload.amount,
        payload.providerPixKey,
        payload.proposalId,
      );
      this.logger.log(`Transfer completed for proposal ${payload.proposalId}`);
    } catch (err) {
      this.logger.error(
        `Transfer failed for proposal ${payload.proposalId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
