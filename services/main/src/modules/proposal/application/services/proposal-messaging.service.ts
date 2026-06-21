import { Injectable, OnModuleInit } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  ProposalExchangeName,
  ProposalRoutingKey,
  ProposalAcceptedPayload,
  ProposalClientConfirmedPayload,
} from '@shared/contracts/events/proposal-events.enum';

@Injectable()
export class ProposalMessagingService implements OnModuleInit {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.assertExchange(ProposalExchangeName.ACCEPTED);
    await this.messagingService.assertExchange(ProposalExchangeName.CLIENT_CONFIRMED);
  }

  async publishProposalAccepted(payload: ProposalAcceptedPayload): Promise<void> {
    await this.messagingService.publish(
      ProposalExchangeName.ACCEPTED,
      ProposalRoutingKey.ACCEPTED,
      payload,
    );
  }

  async publishProposalClientConfirmed(payload: ProposalClientConfirmedPayload): Promise<void> {
    await this.messagingService.publish(
      ProposalExchangeName.CLIENT_CONFIRMED,
      ProposalRoutingKey.CLIENT_CONFIRMED,
      payload,
    );
  }
}
