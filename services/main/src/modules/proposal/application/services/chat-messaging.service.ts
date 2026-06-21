import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ChatExchangeName,
  ChatRoutingKey,
  type EnsureConversationAndSendMessagePayload,
  type EnsureConversationAndSendMessageResponse,
} from '@shared/contracts/events/chat-events.enum';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';

@Injectable()
export class ChatMessagingService implements OnModuleInit {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.assertExchange(ChatExchangeName.COMMANDS);
  }

  async ensureConversationAndSendMessage(
    payload: EnsureConversationAndSendMessagePayload,
  ): Promise<EnsureConversationAndSendMessageResponse> {
    return this.messagingService.request<EnsureConversationAndSendMessageResponse>(
      ChatExchangeName.COMMANDS,
      ChatRoutingKey.ENSURE_CONVERSATION_AND_SEND_MESSAGE,
      payload,
    );
  }
}
