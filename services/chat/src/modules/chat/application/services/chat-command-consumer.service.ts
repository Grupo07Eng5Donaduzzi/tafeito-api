import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import {
  ChatExchangeName,
  ChatRoutingKey,
  type EnsureConversationAndSendMessagePayload,
  type EnsureConversationAndSendMessageResponse,
} from '@shared/contracts/events/chat-events.enum';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

@Injectable()
export class ChatCommandConsumerService implements OnModuleInit {
  constructor(
    private readonly messagingService: SharedMessagingService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.respond<EnsureConversationAndSendMessageResponse>(
      ChatExchangeName.COMMANDS,
      ChatRoutingKey.ENSURE_CONVERSATION_AND_SEND_MESSAGE,
      'chat.commands.ensure-conversation-and-send-message',
      (payload) =>
        this.ensureConversationAndSendMessage(payload as EnsureConversationAndSendMessagePayload),
    );
  }

  private async ensureConversationAndSendMessage(
    payload: EnsureConversationAndSendMessagePayload,
  ): Promise<EnsureConversationAndSendMessageResponse> {
    if (!payload.initiatorId || !payload.participantId || !payload.content?.trim()) {
      throw new BadRequestException('Invalid ensure conversation command payload');
    }

    const conversation = await this.conversationService.getOrCreateConversationBetween(
      payload.initiatorId,
      payload.participantId,
    );
    await this.messageService.sendConversationMessage(
      conversation.conversationId,
      payload.initiatorId,
      payload.participantId,
      payload.content,
    );

    return conversation;
  }
}
