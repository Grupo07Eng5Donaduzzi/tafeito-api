import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Conversation } from '../../domain/models/conversation.entity';
import { CONVERSATION_REPOSITORY } from '../../domain/repositories/conversation-repository.interface';
import type { ConversationRepository } from '../../domain/repositories/conversation-repository.interface';
import { ConversationResponseDto } from '../dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async createConversation(
    serviceId: string,
    initiatorId: string,
    participantIds: string[],
  ): Promise<ConversationResponseDto> {
    const conversation = new Conversation({
      serviceId,
      initiatorId,
      participantIds,
      isActive: true,
    });

    await this.conversationRepository.create(conversation);

    const created = await this.conversationRepository.findById(conversation.id!);
    return this.toDto(created!);
  }

  async getServiceConversations(
    serviceId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepository.findByServiceId(
      serviceId,
    );
    return conversations.map((conv) => this.toDto(conv));
  }

  async getConversationById(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return this.toDto(conversation);
  }

  async updateLastMessage(conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(
      conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.updateLastMessageAt();
    await this.conversationRepository.update(conversation);
  }

  private toDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      serviceId: conversation.serviceId,
      initiatorId: conversation.initiatorId,
      participantIds: conversation.participantIds,
      lastMessageAt: conversation.lastMessageAt,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}
