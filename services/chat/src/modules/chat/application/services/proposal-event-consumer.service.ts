import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  ProposalExchangeName,
  ProposalRoutingKey,
  ProposalAcceptedPayload,
  ProposalContestedPayload,
} from '@shared/contracts/events/proposal-events.enum';
import { ConversationService } from './conversation.service';
import { ChatMessagingService } from './chat-messaging.service';

@Injectable()
export class ProposalEventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ProposalEventConsumerService.name);

  constructor(
    private readonly messagingService: SharedMessagingService,
    private readonly conversationService: ConversationService,
    private readonly chatMessagingService: ChatMessagingService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.consume(
      ProposalExchangeName.ACCEPTED,
      ProposalRoutingKey.ACCEPTED,
      'chat.proposal.accepted',
      (payload) => this.handleProposalAccepted(payload as ProposalAcceptedPayload),
    );

    await this.messagingService.consume(
      ProposalExchangeName.CONTESTED,
      ProposalRoutingKey.CONTESTED,
      'chat.proposal.contested',
      (payload) => this.handleProposalContested(payload as ProposalContestedPayload),
    );
  }

  private async handleProposalAccepted(payload: ProposalAcceptedPayload): Promise<void> {
    await this.ensureConversation(payload.proposalId, payload.clientId, payload.providerId, '');
  }

  private async handleProposalContested(payload: ProposalContestedPayload): Promise<void> {
    await this.ensureConversation(
      payload.proposalId,
      payload.clientId,
      payload.providerId,
      payload.serviceId,
    );
  }

  private async ensureConversation(
    proposalId: string,
    clientId: string,
    providerId: string,
    serviceId: string,
  ): Promise<void> {
    const existing = await this.conversationService.getConversationByProposalId(proposalId);
    if (existing) {
      this.logger.log(`Conversation already exists for proposal ${proposalId}`);
      await this.chatMessagingService.publishConversationCreated({
        proposalId,
        conversationId: existing.id!,
      });
      return;
    }

    const effectiveServiceId = serviceId || proposalId;
    const conversation = await this.conversationService.createConversation(
      effectiveServiceId,
      clientId,
      [clientId, providerId],
      proposalId,
    );

    this.logger.log(`Created conversation ${conversation.id} for proposal ${proposalId}`);

    await this.chatMessagingService.publishConversationCreated({
      proposalId,
      conversationId: conversation.id!,
    });
  }
}
