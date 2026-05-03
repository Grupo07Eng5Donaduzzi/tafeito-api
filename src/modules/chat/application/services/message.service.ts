/* eslint-disable */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Message } from '@chat/domain/models/message.entity';
import type { MessageRepository } from '@chat/domain/repositories/message-repository.interface';
import type { ConversationRepository } from '@chat/domain/repositories/conversation-repository.interface';
import { SendMessageDto } from '../dto/send-message.dto';
import { MessageResponseDto } from '../dto/message-response.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { MessageListResponseDto } from '../dto/message-list-response.dto';
import { ConversationService } from './conversation.service';

@Injectable()
export class MessageService {
  constructor(
    @Inject('MESSAGE_REPOSITORY')
    private readonly messageRepository: MessageRepository,
    @Inject('CONVERSATION_REPOSITORY')
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationService: ConversationService,
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<MessageResponseDto> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = Message.restore({
      serviceId: dto.serviceId,
      senderId: dto.senderId,
      recipientId: dto.recipientId,
      content: dto.content.trim(),
      status: 'sent',
    });

    await this.messageRepository.create(message);

    // Atualizar lastMessageAt da conversa
    const conversation = await this.conversationRepository.findByServiceIdAndInitiator(
      dto.serviceId,
      dto.senderId,
    );

    if (conversation) {
      conversation.updateLastMessageAt(new Date());
      await this.conversationRepository.update(conversation);
    } else {
      // Criar nova conversa se não existir
      await this.conversationService.createConversation({
        serviceId: dto.serviceId,
        initiatorId: dto.senderId,
        participantIds: [dto.senderId, dto.recipientId],
      });
    }

    const created = await this.messageRepository.findById(message.id!);
    return MessageResponseDto.from(created)!;
  }

  async getServiceMessages(
    serviceId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<MessageResponseDto[]> {
    const offset = (page - 1) * pageSize;
    const messages = await this.messageRepository.findByServiceId(
      serviceId,
      pageSize,
      offset,
    );
    return messages.map((msg) => MessageResponseDto.from(msg)!);
  }

  async getMessageById(id: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return MessageResponseDto.from(message)!;
  }

  async markAsRead(messageId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.markAsRead();
    await this.messageRepository.update(message);

    const updated = await this.messageRepository.findById(messageId);
    return MessageResponseDto.from(updated)!;
  }

  async markAsDelivered(messageId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.markAsDelivered();
    await this.messageRepository.update(message);

    const updated = await this.messageRepository.findById(messageId);
    return MessageResponseDto.from(updated)!;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (!message.canDelete()) {
      throw new BadRequestException('This message cannot be deleted');
    }

    await this.messageRepository.delete(messageId);
  }

  async getUserMessages(userId: string, limit: number = 50): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.findBySenderId(userId, limit);
    return messages.map((msg) => MessageResponseDto.from(msg)!);
  }

  async getReceivedMessages(
    userId: string,
    limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.findByRecipientId(userId, limit);
    return messages.map((msg) => MessageResponseDto.from(msg)!);
  }

  async countServiceMessages(serviceId: string): Promise<number> {
    return this.messageRepository.countByServiceId(serviceId);
  }

  async getServiceMessagesWithFilters(
    serviceId: string,
    queryDto: MessageQueryDto,
  ): Promise<MessageListResponseDto> {
    const page = Math.max(1, queryDto.page || 1);
    const pageSize = Math.max(1, Math.min(100, queryDto.pageSize || 50));
    const offset = (page - 1) * pageSize;

    const filters = {
      status: queryDto.status,
      startDate: queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      endDate: queryDto.endDate ? new Date(queryDto.endDate) : undefined,
      search: queryDto.search,
      sortBy: queryDto.sortBy || 'createdAt',
      sortOrder: queryDto.sortOrder || 'desc',
    };

    const [messages, total] = await Promise.all([
      this.messageRepository.findByServiceIdWithFilters(
        serviceId,
        filters,
        pageSize,
        offset,
      ),
      this.messageRepository.countByServiceIdWithFilters(serviceId, filters),
    ]);

    const data = messages.map((msg) => MessageResponseDto.from(msg)!);
    return new MessageListResponseDto(data, total, page, pageSize);
  }
}
