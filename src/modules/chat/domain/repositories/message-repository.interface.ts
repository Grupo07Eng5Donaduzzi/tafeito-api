import { Message } from '../models/message.entity';

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');

export interface MessageRepository {
  create(message: Message): Promise<void>;
  findById(id: string): Promise<Message | null>;
  findByServiceId(
    serviceId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]>;
  findBySenderId(senderId: string, limit: number): Promise<Message[]>;
  findByRecipientId(recipientId: string, limit: number): Promise<Message[]>;
  update(message: Message): Promise<void>;
  delete(id: string): Promise<void>;
  countByServiceId(serviceId: string): Promise<number>;
  findByServiceIdWithFilters(
    serviceId: string,
    filters: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      sortBy?: 'createdAt' | 'senderId';
      sortOrder?: 'asc' | 'desc';
    },
    limit: number,
    offset: number,
  ): Promise<Message[]>;
  countByServiceIdWithFilters(
    serviceId: string,
    filters: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    },
  ): Promise<number>;
}
