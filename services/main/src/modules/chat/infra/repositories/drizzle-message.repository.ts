/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { messageSchema } from '../schemas/message.schema';
import { Message } from '../../domain/models/message.entity';
import type { MessageRepository } from '../../domain/repositories/message-repository.interface';
import { eq, desc, or, count, and } from 'drizzle-orm';

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(message: Message): Promise<void> {
    await this.drizzleService.db.insert(messageSchema).values({
      serviceId: message.serviceId,
      conversationId: message.conversationId,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    });
  }

  async findById(id: string): Promise<Message | null> {
    const result = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.id, id));

    return result.length > 0 ? Message.restore(result[0]) : null;
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

    return results.map((row) => Message.restore(row)!);
  }

  async findByServiceIdAndParticipant(
    serviceId: string,
    participantId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> {
    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(
        and(
          eq(messageSchema.serviceId, serviceId),
          or(
            eq(messageSchema.senderId, participantId),
            eq(messageSchema.recipientId, participantId),
          ),
        ),
      )
      .orderBy(desc(messageSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((row) => Message.restore(row)!);
  }

  async findBySenderId(senderId: string, limit: number): Promise<Message[]> {
    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.senderId, senderId))
      .orderBy(desc(messageSchema.createdAt))
      .limit(limit);

    return results.map((row) => Message.restore(row)!);
  }

  async findByConversationId(
    conversationId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> {
    const results = await this.drizzleService.db
      .select()
      .from(messageSchema)
      .where(eq(messageSchema.conversationId, conversationId))
      .orderBy(desc(messageSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((row) => Message.restore(row)!);
  }

  async update(message: Message): Promise<void> {
    await this.drizzleService.db
      .update(messageSchema)
      .set({
        status: message.status,
        conversationId: message.conversationId,
        updatedAt: message.updatedAt,
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
      .select({ value: count() })
      .from(messageSchema)
      .where(eq(messageSchema.serviceId, serviceId));

    return result[0]?.value ?? 0;
  }

  async countByServiceIdAndParticipant(
    serviceId: string,
    participantId: string,
  ): Promise<number> {
    const result = await this.drizzleService.db
      .select({ value: count() })
      .from(messageSchema)
      .where(
        and(
          eq(messageSchema.serviceId, serviceId),
          or(
            eq(messageSchema.senderId, participantId),
            eq(messageSchema.recipientId, participantId),
          ),
        ),
      );

    return result[0]?.value ?? 0;
  }

  async countByConversationId(conversationId: string): Promise<number> {
    const result = await this.drizzleService.db
      .select({ value: count() })
      .from(messageSchema)
      .where(eq(messageSchema.conversationId, conversationId));

    return result[0]?.value ?? 0;
  }
}
