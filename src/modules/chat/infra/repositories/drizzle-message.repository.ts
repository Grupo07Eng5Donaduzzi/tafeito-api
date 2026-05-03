/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import type { InferModel } from 'drizzle-orm';
import { Message } from '../../domain/models/message.entity';
import { messageSchema } from '../schemas/message.schema';
import type { MessageRepository } from '../../domain/repositories/message-repository.interface';
import { eq, desc, and, like, gte, lte, asc } from 'drizzle-orm';

type MessageRow = InferModel<typeof messageSchema>;

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(message: Message): Promise<void> {
    await this.drizzleService.db.insert(messageSchema).values({
      serviceId: message.serviceId,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      status: message.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findById(id: string): Promise<Message | null> {
    const result = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0] as MessageRow;
    return Message.restore({
      id: row.id,
      serviceId: row.serviceId,
      senderId: row.senderId,
      recipientId: row.recipientId,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByServiceId(
    serviceId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> {
    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.serviceId, serviceId))
      .orderBy(desc(messageSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return (results as MessageRow[]).map((row) =>
      Message.restore({
        id: row.id,
        serviceId: row.serviceId,
        senderId: row.senderId,
        recipientId: row.recipientId,
        content: row.content,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async findBySenderId(senderId: string, limit: number): Promise<Message[]> {
    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.senderId, senderId))
      .orderBy(desc(messageSchema.createdAt))
      .limit(limit);

    return (results as MessageRow[]).map((row) =>
      Message.restore({
        id: row.id,
        serviceId: row.serviceId,
        senderId: row.senderId,
        recipientId: row.recipientId,
        content: row.content,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async findByRecipientId(
    recipientId: string,
    limit: number,
  ): Promise<Message[]> {
    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.recipientId, recipientId))
      .orderBy(desc(messageSchema.createdAt))
      .limit(limit);

    return (results as MessageRow[]).map((row) =>
      Message.restore({
        id: row.id,
        serviceId: row.serviceId,
        senderId: row.senderId,
        recipientId: row.recipientId,
        content: row.content,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async update(message: Message): Promise<void> {
    await this.drizzleService.db
      .update(messageSchema)
      .set({
        status: message.status,
        updatedAt: new Date(),
      })
      .where(eq(messageSchema.id, message.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(messageSchema)
      .where(eq(messageSchema.id, id));
  }

  async countByServiceId(serviceId: string): Promise<number> {
    const result = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.serviceId, serviceId));

    return (result as MessageRow[]).length;
  }

  async findByServiceIdWithFilters(
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
  ): Promise<Message[]> {
    const whereClauses = [eq(messageSchema.serviceId, serviceId)];

    if (filters.status) {
      whereClauses.push(eq(messageSchema.status, filters.status as any));
    }
    if (filters.startDate) {
      whereClauses.push(gte(messageSchema.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      whereClauses.push(lte(messageSchema.createdAt, filters.endDate));
    }
    if (filters.search) {
      whereClauses.push(like(messageSchema.content, `%${filters.search}%`));
    }

    const sortColumn =
      filters.sortBy === 'senderId' ? messageSchema.senderId : messageSchema.createdAt;
    const sortOrder = filters.sortOrder === 'asc' ? asc : desc;

    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(and(...whereClauses))
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset);

    return (results as MessageRow[]).map((row) =>
      Message.restore({
        id: row.id,
        serviceId: row.serviceId,
        senderId: row.senderId,
        recipientId: row.recipientId,
        content: row.content,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async countByServiceIdWithFilters(
    serviceId: string,
    filters: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    },
  ): Promise<number> {
    const whereClauses = [eq(messageSchema.serviceId, serviceId)];

    if (filters.status) {
      whereClauses.push(eq(messageSchema.status, filters.status as any));
    }
    if (filters.startDate) {
      whereClauses.push(gte(messageSchema.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      whereClauses.push(lte(messageSchema.createdAt, filters.endDate));
    }
    if (filters.search) {
      whereClauses.push(like(messageSchema.content, `%${filters.search}%`));
    }

    const result = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(and(...whereClauses));

    return (result as MessageRow[]).length;
  }
}
