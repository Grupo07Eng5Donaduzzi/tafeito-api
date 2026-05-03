import type { MessageStatus } from '@chat/domain/models/message.entity';

export class MessageQueryDto {
  page?: number = 1;
  pageSize?: number = 50;
  status?: MessageStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'senderId' = 'createdAt';
  sortOrder?: 'asc' | 'desc' = 'desc';
}
