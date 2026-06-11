import { IsOptional, IsString, IsUUID } from 'class-validator';
import type { MessageStatus } from '../../domain/models/message.entity';

export class SendMessageDto {
  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsUUID()
  senderId?: string;

  @IsUUID()
  recipientId!: string;

  @IsString()
  content!: string;
}

export class SendConversationMessageDto {
  @IsUUID()
  recipientId!: string;

  @IsString()
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
