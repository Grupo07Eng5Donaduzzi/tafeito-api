import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  ChatExchangeName,
  ChatRoutingKey,
  ConversationCreatedPayload,
} from '@shared/contracts/events/chat-events.enum';
import type { ProposalRepository } from '../../domain/repositories/proposal-repository.interface';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal-repository.interface';

@Injectable()
export class ConversationEventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConversationEventConsumerService.name);

  constructor(
    private readonly messagingService: SharedMessagingService,
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.consume(
      ChatExchangeName.CONVERSATION_CREATED,
      ChatRoutingKey.CONVERSATION_CREATED,
      'main.conversation.created',
      (payload) => this.handleConversationCreated(payload as ConversationCreatedPayload),
    );
  }

  private async handleConversationCreated(payload: ConversationCreatedPayload): Promise<void> {
    this.logger.log(
      `Conversation ${payload.conversationId} created for proposal ${payload.proposalId}`,
    );

    const proposal = await this.proposalRepository.findById(payload.proposalId);
    if (!proposal) {
      this.logger.warn(`Proposal ${payload.proposalId} not found for conversation.created event`);
      return;
    }

    proposal.linkChat(payload.conversationId);
    await this.proposalRepository.update(proposal);
  }
}
