import type { MessageStatus } from '../../domain/models/message.entity';

export class SendMessageDto {
  serviceId!: string;
  conversationId?: string;
  senderId!: string;
  recipientId!: string;
  content!: string;
}

export class SendConversationMessageDto {
  recipientId!: string;
  content!: string;
}

export class MessageResponseDto {
  id?: string;
  serviceId!: string;
  conversationId?: string;
  senderId!: string;
  recipientId!: string;
  content!: string;
  status!: MessageStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MessageListDto {
  data!: MessageResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  hasMore!: boolean;
}
