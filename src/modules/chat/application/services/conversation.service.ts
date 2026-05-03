import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Conversation } from '../../domain/models/conversation.entity';
import type { ConversationRepository } from '../../domain/repositories/conversation-repository.interface';
import { ConversationResponseDto } from '../dto/conversation-response.dto';
import {
  CreateConversationDto,
  UpdateConversationDto,
} from '../dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject('CONVERSATION_REPOSITORY')
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async createConversation(
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = Conversation.restore({
      serviceId: dto.serviceId,
      initiatorId: dto.initiatorId,
      participantIds: dto.participantIds,
      isActive: true,
    });

    await this.conversationRepository.create(conversation);

    const created = await this.conversationRepository.findById(
      conversation.id!,
    );
    return ConversationResponseDto.from(created)!;
  }

  async getServiceConversations(
    serviceId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversations =
      await this.conversationRepository.findByServiceId(serviceId);
    return conversations.map((conv) => ConversationResponseDto.from(conv)!);
  }

  async getConversationById(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return ConversationResponseDto.from(conversation)!;
  }

  async addParticipant(conversationId: string, userId: string): Promise<void> {
    // eslint-disable-next-line
    const conversation = await this.conversationRepository.findById(
      conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.addParticipant(userId);
    await this.conversationRepository.update(conversation);
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // eslint-disable-next-line
    const conversation = await this.conversationRepository.findById(
      conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.removeParticipant(userId);
    await this.conversationRepository.update(conversation);
  }

  async updateConversation(
    id: string,
    dto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (dto.participantIds) {
      const newParticipants = dto.participantIds;
      conversation.participantIds.forEach((id) => {
        if (!newParticipants.includes(id)) {
          conversation.removeParticipant(id);
        }
      });
      newParticipants.forEach((id) => {
        conversation.addParticipant(id);
      });
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        conversation.activate();
      } else {
        conversation.deactivate();
      }
    }

    await this.conversationRepository.update(conversation);

    const updated = await this.conversationRepository.findById(id);
    return ConversationResponseDto.from(updated)!;
  }

  async deactivateConversation(id: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.deactivate();
    await this.conversationRepository.update(conversation);
  }

  async activateConversation(id: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    conversation.activate();
    await this.conversationRepository.update(conversation);
  }
}
