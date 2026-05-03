/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Conversation } from '@chat/domain/models/conversation.entity';
import { conversationSchema } from '@chat/infra/schemas/conversation.schema';
import type { ConversationRepository } from '@chat/domain/repositories/conversation-repository.interface';
import { eq, and } from 'drizzle-orm';

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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    const result = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(eq(conversationSchema.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return Conversation.restore({
      id: row.id,
      serviceId: row.serviceId,
      initiatorId: row.initiatorId,
      participantIds: row.participantIds,
      lastMessageAt: row.lastMessageAt || undefined,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByServiceId(serviceId: string): Promise<Conversation[]> {
    const results = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(eq(conversationSchema.serviceId, serviceId));

    return results.map((row) =>
      Conversation.restore({
        id: row.id,
        serviceId: row.serviceId,
        initiatorId: row.initiatorId,
        participantIds: row.participantIds,
        lastMessageAt: row.lastMessageAt || undefined,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async findByServiceIdAndInitiator(
    serviceId: string,
    initiatorId: string,
  ): Promise<Conversation | null> {
    const result = await this.drizzleService.db
      .select()
      .from(conversationSchema)
      .where(
        and(
          eq(conversationSchema.serviceId, serviceId),
          eq(conversationSchema.initiatorId, initiatorId),
        ),
      )
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return Conversation.restore({
      id: row.id,
      serviceId: row.serviceId,
      initiatorId: row.initiatorId,
      participantIds: row.participantIds,
      lastMessageAt: row.lastMessageAt || undefined,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async update(conversation: Conversation): Promise<void> {
    await this.drizzleService.db
      .update(conversationSchema)
      .set({
        participantIds: conversation.participantIds,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        updatedAt: new Date(),
      })
      .where(eq(conversationSchema.id, conversation.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(conversationSchema)
      .where(eq(conversationSchema.id, id));
  }
}
