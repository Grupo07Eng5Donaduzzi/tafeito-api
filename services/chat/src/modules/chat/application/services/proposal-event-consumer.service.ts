import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  type ProposalAcceptedPayload,
  ProposalExchangeName,
  ProposalRoutingKey,
} from '@shared/contracts/events/proposal-events.enum';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { ConversationService } from './conversation.service';

@Injectable()
export class ProposalEventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ProposalEventConsumerService.name);

  constructor(
    private readonly messagingService: SharedMessagingService,
    private readonly conversationService: ConversationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.consume(
      ProposalExchangeName.ACCEPTED,
      ProposalRoutingKey.ACCEPTED,
      'chat.proposal.accepted',
      (payload) => this.handleProposalAccepted(payload as ProposalAcceptedPayload),
    );
  }

  private async handleProposalAccepted(payload: ProposalAcceptedPayload): Promise<void> {
    const conversation = await this.conversationService.getOrCreateConversationBetween(
      payload.clientId,
      payload.providerId,
    );
    this.logger.log(
      `Conversation ${conversation.conversationId} ensured for accepted proposal ${payload.proposalId}`,
    );
  }
}
