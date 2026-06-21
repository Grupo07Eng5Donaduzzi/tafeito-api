import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Conversation } from '../../domain/models/conversation.entity';
import { CONVERSATION_REPOSITORY } from '../../domain/repositories/conversation-repository.interface';
import type { ConversationRepository } from '../../domain/repositories/conversation-repository.interface';
import {
  ConversationResponseDto,
  EnsureConversationResponseDto,
} from '../dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async getOrCreateConversationBetween(
    userId1: string,
    userId2: string,
  ): Promise<EnsureConversationResponseDto> {
    const existing = await this.conversationRepository.findByParticipants(userId1, userId2);
    if (existing) {
      return { conversationId: existing.id!, isNew: false };
    }

    const conversation = new Conversation({
      initiatorId: userId1,
      participantIds: [userId1, userId2],
      isActive: true,
    });

    await this.conversationRepository.create(conversation);
    return { conversationId: conversation.id!, isNew: true };
  }

  async getUserConversations(userId: string): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepository.findByParticipantId(userId);
    return conversations.map((conv) => this.toDto(conv, userId));
  }

  async getConversationById(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return this.toDto(conversation);
  }

  async updateLastMessage(conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.updateLastMessageAt();
    await this.conversationRepository.update(conversation);
  }

  private toDto(conversation: Conversation, currentUserId?: string): ConversationResponseDto {
    return {
      id: conversation.id,
      initiatorId: conversation.initiatorId,
      participantIds: conversation.participantIds,
      otherParticipantId: currentUserId
        ? conversation.participantIds.find((id) => id !== currentUserId)
        : undefined,
      lastMessageAt: conversation.lastMessageAt,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}
