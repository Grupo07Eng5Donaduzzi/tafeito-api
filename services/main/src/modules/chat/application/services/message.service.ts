import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Message } from '../../domain/models/message.entity';
import { MESSAGE_REPOSITORY } from '../../domain/repositories/message-repository.interface';
import type { MessageRepository } from '../../domain/repositories/message-repository.interface';
import { ConversationService } from './conversation.service';
import {
  SendMessageDto,
  MessageResponseDto,
  MessageListDto,
} from '../dto/message.dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    private readonly conversationService: ConversationService,
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<MessageResponseDto> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = new Message({
      serviceId: dto.serviceId,
      conversationId: dto.conversationId,
      senderId: dto.senderId,
      recipientId: dto.recipientId,
      content: dto.content.trim(),
      status: 'sent',
    });

    await this.messageRepository.create(message);

    const created = await this.messageRepository.findById(message.id!);
    return this.toDto(created!);
  }

  async sendMessageAsUser(
    dto: Omit<SendMessageDto, 'senderId'>,
    senderId: string,
  ): Promise<MessageResponseDto> {
    return this.sendMessage({
      ...dto,
      senderId,
    });
  }

  async getServiceMessages(
    serviceId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<MessageListDto> {
    const offset = (page - 1) * pageSize;
    const messages = await this.messageRepository.findByServiceId(
      serviceId,
      pageSize,
      offset,
    );
    const total = await this.messageRepository.countByServiceId(serviceId);

    return {
      data: messages.map((msg) => this.toDto(msg)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getServiceMessagesForUser(
    serviceId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<MessageListDto> {
    const offset = (page - 1) * pageSize;
    const messages = await this.messageRepository.findByServiceIdAndParticipant(
      serviceId,
      userId,
      pageSize,
      offset,
    );
    const total = await this.messageRepository.countByServiceIdAndParticipant(
      serviceId,
      userId,
    );

    return {
      data: messages.map((msg) => this.toDto(msg)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getMessageById(id: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return this.toDto(message);
  }

  async sendConversationMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string,
  ): Promise<MessageResponseDto> {
    const conversation =
      await this.conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(senderId)) {
      throw new ForbiddenException('You cannot send messages in this chat');
    }
    if (!conversation.participantIds.includes(recipientId)) {
      throw new BadRequestException('Recipient is not part of this chat');
    }

    const message = await this.sendMessage({
      serviceId: conversation.serviceId,
      conversationId,
      senderId,
      recipientId,
      content,
    });
    await this.conversationService.updateLastMessage(conversationId);
    return message;
  }

  async getConversationMessagesForUser(
    conversationId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<MessageListDto> {
    const conversation =
      await this.conversationService.getConversationById(conversationId);
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You cannot access this chat');
    }

    const offset = (page - 1) * pageSize;
    const messages = await this.messageRepository.findByConversationId(
      conversationId,
      pageSize,
      offset,
    );
    const total =
      await this.messageRepository.countByConversationId(conversationId);

    return {
      data: messages.map((msg) => this.toDto(msg)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getMessageByIdForUser(
    id: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.findExistingMessage(id);
    this.assertParticipant(message, userId);
    return this.toDto(message);
  }

  async markAsRead(messageId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.markAsRead();
    await this.messageRepository.update(message);

    const updated = await this.messageRepository.findById(messageId);
    return this.toDto(updated!);
  }

  async markAsReadForUser(
    messageId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.findExistingMessage(messageId);
    this.assertRecipient(message, userId);

    message.markAsRead();
    await this.messageRepository.update(message);

    const updated = await this.messageRepository.findById(messageId);
    return this.toDto(updated!);
  }

  async markAsDelivered(messageId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.markAsDelivered();
    await this.messageRepository.update(message);

    const updated = await this.messageRepository.findById(messageId);
    return this.toDto(updated!);
  }

  async markAsDeliveredForUser(
    messageId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.findExistingMessage(messageId);
    this.assertRecipient(message, userId);

    message.markAsDelivered();
    await this.messageRepository.update(message);

    const updated = await this.messageRepository.findById(messageId);
    return this.toDto(updated!);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.messageRepository.delete(messageId);
  }

  async deleteMessageForUser(messageId: string, userId: string): Promise<void> {
    const message = await this.findExistingMessage(messageId);
    this.assertParticipant(message, userId);
    await this.messageRepository.delete(messageId);
  }

  async getUserMessages(
    userId: string,
    limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.findBySenderId(userId, limit);
    return messages.map((msg) => this.toDto(msg));
  }

  private toDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      serviceId: message.serviceId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private async findExistingMessage(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  private assertParticipant(message: Message, userId: string): void {
    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ForbiddenException('You cannot access this message');
    }
  }

  private assertRecipient(message: Message, userId: string): void {
    if (message.recipientId !== userId) {
      throw new ForbiddenException('Only the recipient can update this status');
    }
  }
}
