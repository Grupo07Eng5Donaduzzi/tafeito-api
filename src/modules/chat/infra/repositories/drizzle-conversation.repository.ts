/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { conversationSchema } from '../schemas/conversation.schema';
import { Conversation } from '../../domain/models/conversation.entity';
import type { ConversationRepository } from '../../domain/repositories/conversation-repository.interface';
import { eq } from 'drizzle-orm';

@Injectable()
export class DrizzleConversationRepository implements ConversationRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(conversation: Conversation): Promise<void> {
    await this.drizzleService.db.insert(conversationSchema).values({
      serviceId: conversation.serviceId,
      initiatorId: conversation.initiatorId,
      participantIds: conversation.participantIds,
      lastMessageAt: conversation.lastMessageAt,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    const result = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(eq(conversationSchema.id, id));

    return result.length > 0 ? Conversation.restore(result[0]) : null;
  }

  async findByServiceId(serviceId: string): Promise<Conversation[]> {
    const results = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(eq(conversationSchema.serviceId, serviceId));

    return (results as any[]).map((row) => Conversation.restore(row)!);
  }

  async update(conversation: Conversation): Promise<void> {
    await this.drizzleService.db
      .update(conversationSchema)
      .set({
        participantIds: conversation.participantIds,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        updatedAt: conversation.updatedAt,
      })
      .where(eq(conversationSchema.id, conversation.id!));
  }
}
