import { Module } from '@nestjs/common';
import { ChatCommandConsumerService } from './application/services/chat-command-consumer.service';
import { ConversationService } from './application/services/conversation.service';
import { MessageService } from './application/services/message.service';
import { ProposalEventConsumerService } from './application/services/proposal-event-consumer.service';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation-repository.interface';
import { MESSAGE_REPOSITORY } from './domain/repositories/message-repository.interface';
import { ChatController } from './infra/controllers/chat.controller';
import { ChatGateway } from './infra/gateways/chat.gateway';
import { DrizzleConversationRepository } from './infra/repositories/drizzle-conversation.repository';
import { DrizzleMessageRepository } from './infra/repositories/drizzle-message.repository';

@Module({
  controllers: [ChatController],
  providers: [
    MessageService,
    ConversationService,
    ChatCommandConsumerService,
    ProposalEventConsumerService,
    ChatGateway,
    DrizzleMessageRepository,
    DrizzleConversationRepository,
    { provide: MESSAGE_REPOSITORY, useExisting: DrizzleMessageRepository },
    { provide: CONVERSATION_REPOSITORY, useExisting: DrizzleConversationRepository },
  ],
})
export class ChatModule {}
