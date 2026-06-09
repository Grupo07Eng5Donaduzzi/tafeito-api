import { Module } from '@nestjs/common';
import { ChatController } from './infra/controllers/chat.controller';
import { ChatGateway } from './infra/gateways/chat.gateway';
import { MessageService } from './application/services/message.service';
import { ConversationService } from './application/services/conversation.service';
import { ChatMessagingService } from './application/services/chat-messaging.service';
import { ProposalEventConsumerService } from './application/services/proposal-event-consumer.service';
import { DrizzleMessageRepository } from './infra/repositories/drizzle-message.repository';
import { DrizzleConversationRepository } from './infra/repositories/drizzle-conversation.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message-repository.interface';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation-repository.interface';

@Module({
  controllers: [ChatController],
  providers: [
    MessageService,
    ConversationService,
    ChatMessagingService,
    ProposalEventConsumerService,
    ChatGateway,
    DrizzleMessageRepository,
    DrizzleConversationRepository,
    { provide: MESSAGE_REPOSITORY, useExisting: DrizzleMessageRepository },
    { provide: CONVERSATION_REPOSITORY, useExisting: DrizzleConversationRepository },
  ],
})
export class ChatModule {}
