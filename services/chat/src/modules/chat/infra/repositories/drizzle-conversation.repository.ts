/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { sql, eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { conversationSchema } from '../database/schemas/conversation.schema';
import { Conversation } from '../../domain/models/conversation.entity';
import type { ConversationRepository } from '../../domain/repositories/conversation-repository.interface';

@Injectable()
export class DrizzleConversationRepository implements ConversationRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(conversation: Conversation): Promise<void> {
    conversation.id = conversation.id ?? randomUUID();

    await this.drizzleService.db.insert(conversationSchema).values({
      id: conversation.id,
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

  async findByParticipants(userId1: string, userId2: string): Promise<Conversation | null> {
    const result = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(
        sql`${userId1} = ANY(${conversationSchema.participantIds}) AND ${userId2} = ANY(${conversationSchema.participantIds})`,
      )
      .limit(1);

    return result.length > 0 ? Conversation.restore(result[0]) : null;
  }

  async findByParticipantId(userId: string): Promise<Conversation[]> {
    const results = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(sql`${userId} = ANY(${conversationSchema.participantIds})`)
      .orderBy(conversationSchema.lastMessageAt);

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
