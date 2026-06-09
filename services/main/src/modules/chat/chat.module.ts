import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { ChatController } from './infra/controllers/chat.controller';
import { ChatGateway } from './infra/gateways/chat.gateway';
import { MessageService } from './application/services/message.service';
import { ConversationService } from './application/services/conversation.service';
import { DrizzleMessageRepository } from './infra/repositories/drizzle-message.repository';
import { DrizzleConversationRepository } from './infra/repositories/drizzle-conversation.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message-repository.interface';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation-repository.interface';

@Module({
  imports: [SharedModule],
  controllers: [ChatController],
  providers: [
    MessageService,
    ConversationService,
    ChatGateway,
    DrizzleMessageRepository,
    DrizzleConversationRepository,
    {
      provide: MESSAGE_REPOSITORY,
      useExisting: DrizzleMessageRepository,
    },
    {
      provide: CONVERSATION_REPOSITORY,
      useExisting: DrizzleConversationRepository,
    },
  ],
  exports: [MessageService, ConversationService],
})
export class ChatModule {}
