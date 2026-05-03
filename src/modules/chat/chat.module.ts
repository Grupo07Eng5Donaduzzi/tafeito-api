/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module, InjectionToken } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { ChatController } from '@chat/infra/controllers/chat.controller';
import { ChatGateway } from '@chat/infra/gateways/chat.gateway';
import { MessageService } from '@chat/application/services/message.service';
import { ConversationService } from '@chat/application/services/conversation.service';
import { DrizzleMessageRepository } from '@chat/infra/repositories/drizzle-message.repository';
import { DrizzleConversationRepository } from '@chat/infra/repositories/drizzle-conversation.repository';

@Module({
  imports: [SharedModule],
  controllers: [ChatController],
  providers: [
    MessageService,
    ConversationService,
    ChatGateway,
    {
      provide: 'MESSAGE_REPOSITORY' as InjectionToken,
      useClass: DrizzleMessageRepository as any,
    },
    {
      provide: 'CONVERSATION_REPOSITORY' as InjectionToken,
      useClass: DrizzleConversationRepository as any,
    },
  ],
  exports: [MessageService, ConversationService],
})
export class ChatModule {}
