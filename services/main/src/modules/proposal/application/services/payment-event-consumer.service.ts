import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  PaymentExchangeName,
  PaymentRoutingKey,
  PaymentCreatedPayload,
  PaymentConfirmedPayload,
} from '@shared/contracts/events/payment-events.enum';
import type { ProposalRepository } from '../../domain/repositories/proposal-repository.interface';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal-repository.interface';
import { Inject } from '@nestjs/common';
import { BudgetRequestService } from '../../../budget-requests/application/services/budget-request.service';
import { ScheduleService } from '../../../schedules/application/services/schedule.service';

@Injectable()
export class PaymentEventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventConsumerService.name);

  constructor(
    private readonly messagingService: SharedMessagingService,
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
    private readonly budgetRequestService: BudgetRequestService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.consume(
      PaymentExchangeName.CREATED,
      PaymentRoutingKey.CREATED,
      'main.payment.created',
      (payload) => this.handlePaymentCreated(payload as PaymentCreatedPayload),
    );

    await this.messagingService.consume(
      PaymentExchangeName.CONFIRMED,
      PaymentRoutingKey.CONFIRMED,
      'main.payment.confirmed',
      (payload) => this.handlePaymentConfirmed(payload as PaymentConfirmedPayload),
    );
  }

  private async handlePaymentCreated(payload: PaymentCreatedPayload): Promise<void> {
    this.logger.log(`Payment created for proposal ${payload.proposalId}`);

    try {
      const proposal = await this.proposalRepository.findById(payload.proposalId);
      if (!proposal) {
        this.logger.warn(`Proposal ${payload.proposalId} not found for payment.created event`);
        return;
      }

      proposal.setPaymentData(payload.paymentId, payload.qrCode, payload.qrCodeBase64, payload.ticketUrl);
      await this.proposalRepository.update(proposal);
    } catch (err) {
      this.logger.error(
        `Failed to process payment.created for ${payload.proposalId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  private async handlePaymentConfirmed(payload: PaymentConfirmedPayload): Promise<void> {
    this.logger.log(`Payment confirmed for proposal ${payload.proposalId}`);

    const proposal = await this.proposalRepository.findById(payload.proposalId);
    if (!proposal) {
      this.logger.warn(`Proposal ${payload.proposalId} not found for payment.confirmed event`);
      return;
    }

    proposal.confirmPayment();
    await this.proposalRepository.update(proposal);

    const budgetRequest = await this.budgetRequestService.findById(proposal.requestId);
    if (budgetRequest) {
      try {
        await this.scheduleService.create({
          proposalId: proposal.id!,
          budgetRequestId: budgetRequest.id,
        });
      } catch (err) {
        this.logger.warn(
          `Failed to auto-create schedule for proposal ${payload.proposalId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
