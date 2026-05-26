import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import {
  Proposal,
  NegotiationMessage,
  ProposalStatus,
  SenderRole,
} from '../../domain/models/proposal.entity';
import {
  ProposalRepository,
  NegotiationMessageRepository,
} from '../../domain/repositories/proposal-repository.interface';
import {
  proposalsSchema,
  negotiationMessagesSchema,
} from '../schemas/proposal.schema';
import { eq, and, count } from 'drizzle-orm';

@Injectable()
export class DrizzleProposalRepository implements ProposalRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(proposal: Proposal): Promise<void> {
    await this.drizzleService.db.insert(proposalsSchema).values({
      requestId: proposal.requestId,
      clientId: proposal.clientId,
      providerId: proposal.providerId,
      estimatedHours: proposal.estimatedHours.toString(),
      hourlyRate: proposal.hourlyRate.toString(),
      amount: proposal.amount.toString(),
      status: proposal.status,
      rejectionReason: proposal.rejectionReason,
      linkedChatId: proposal.linkedChatId,
      canResubmit: proposal.canResubmit,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(proposal: Proposal): Promise<void> {
    await this.drizzleService.db
      .update(proposalsSchema)
      .set({
        amount: proposal.amount.toString(),
        estimatedHours: proposal.estimatedHours.toString(),
        hourlyRate: proposal.hourlyRate.toString(),
        status: proposal.status,
        rejectionReason: proposal.rejectionReason,
        linkedChatId: proposal.linkedChatId,
        canResubmit: proposal.canResubmit,
        updatedAt: new Date(),
      })
      .where(eq(proposalsSchema.id, proposal.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(proposalsSchema)
      .where(eq(proposalsSchema.id, id));
  }

  async findAll(): Promise<Proposal[]> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .orderBy(proposalsSchema.createdAt);

    return result.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Proposal | null> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByRequestId(requestId: string): Promise<Proposal[]> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.requestId, requestId))
      .orderBy(proposalsSchema.createdAt);

    return result.map(this.mapToEntity);
  }

  async findByProviderId(
    providerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(proposalsSchema)
      .where(eq(proposalsSchema.providerId, providerId));

    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.providerId, providerId))
      .orderBy(proposalsSchema.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data: result.map(this.mapToEntity), total: Number(total) };
  }

  async findByClientId(
    clientId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(proposalsSchema)
      .where(eq(proposalsSchema.clientId, clientId));

    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.clientId, clientId))
      .orderBy(proposalsSchema.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data: result.map(this.mapToEntity), total: Number(total) };
  }

  async findByRequestAndProvider(
    requestId: string,
    providerId: string,
  ): Promise<Proposal | null> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(
        and(
          eq(proposalsSchema.requestId, requestId),
          eq(proposalsSchema.providerId, providerId),
        ),
      )
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  private mapToEntity(row: any): Proposal {
    return Proposal.restore({
      id: row.id,
      requestId: row.requestId,
      clientId: row.clientId,
      providerId: row.providerId,
      estimatedHours: parseFloat(row.estimatedHours),
      hourlyRate: parseFloat(row.hourlyRate),
      amount: parseFloat(row.amount),
      status: row.status as ProposalStatus,
      rejectionReason: row.rejectionReason,
      linkedChatId: row.linkedChatId,
      canResubmit: row.canResubmit,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

@Injectable()
export class DrizzleNegotiationMessageRepository implements NegotiationMessageRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(message: NegotiationMessage): Promise<void> {
    await this.drizzleService.db.insert(negotiationMessagesSchema).values({
      proposalId: message.proposalId,
      senderRole: message.senderRole,
      senderUserId: message.senderUserId,
      message: message.message,
      revisedAmount: message.revisedAmount?.toString(),
      createdAt: new Date(),
    });
  }

  async findByProposalId(
    proposalId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: NegotiationMessage[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(negotiationMessagesSchema)
      .where(eq(negotiationMessagesSchema.proposalId, proposalId));

    const result = await this.drizzleService.db
      .select()
      .from(negotiationMessagesSchema)
      .where(eq(negotiationMessagesSchema.proposalId, proposalId))
      .orderBy(negotiationMessagesSchema.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data: result.map(this.mapToEntity), total: Number(total) };
  }

  async findById(id: string): Promise<NegotiationMessage | null> {
    const result = await this.drizzleService.db
      .select()
      .from(negotiationMessagesSchema)
      .where(eq(negotiationMessagesSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  private mapToEntity(row: any): NegotiationMessage {
    return NegotiationMessage.restore({
      id: row.id,
      proposalId: row.proposalId,
      senderRole: row.senderRole as SenderRole,
      senderUserId: row.senderUserId,
      message: row.message,
      revisedAmount: row.revisedAmount
        ? parseFloat(row.revisedAmount)
        : undefined,
      createdAt: row.createdAt,
    });
  }
}
