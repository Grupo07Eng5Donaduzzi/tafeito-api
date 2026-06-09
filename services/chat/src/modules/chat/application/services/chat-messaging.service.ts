import { Injectable, OnModuleInit } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  ChatExchangeName,
  ChatRoutingKey,
  ConversationCreatedPayload,
} from '@shared/contracts/events/chat-events.enum';

@Injectable()
export class ChatMessagingService implements OnModuleInit {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.assertExchange(ChatExchangeName.CONVERSATION_CREATED);
  }

  async publishConversationCreated(payload: ConversationCreatedPayload): Promise<void> {
    await this.messagingService.publish(
      ChatExchangeName.CONVERSATION_CREATED,
      ChatRoutingKey.CONVERSATION_CREATED,
      payload,
    );
  }
}
