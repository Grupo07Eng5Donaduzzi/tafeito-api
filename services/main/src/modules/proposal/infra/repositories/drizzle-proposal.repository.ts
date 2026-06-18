import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
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
import { eq, and } from 'drizzle-orm';
import { budgetRequestsSchema } from '../../../budget-requests/infra/schemas/budget-request.schema';

@Injectable()
export class DrizzleProposalRepository implements ProposalRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(proposal: Proposal): Promise<void> {
    await this.drizzleService.db.insert(proposalsSchema).values({
      requestId: proposal.requestId,
      clientId: proposal.clientId,
      providerId: proposal.providerId,
      amount: proposal.amount.toString(),
      status: proposal.status,
      rejectionReason: proposal.rejectionReason,
      linkedChatId: proposal.linkedChatId,
      canResubmit: proposal.canResubmit,
      paymentId: proposal.paymentId,
      qrCode: proposal.qrCode,
      qrCodeBase64: proposal.qrCodeBase64,
      ticketUrl: proposal.ticketUrl,
      invoiceFile: proposal.invoiceFile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(proposal: Proposal): Promise<void> {
    await this.drizzleService.db
      .update(proposalsSchema)
      .set({
        amount: proposal.amount.toString(),
        status: proposal.status,
        rejectionReason: proposal.rejectionReason,
        linkedChatId: proposal.linkedChatId,
        canResubmit: proposal.canResubmit,
        paymentId: proposal.paymentId,
        qrCode: proposal.qrCode,
        qrCodeBase64: proposal.qrCodeBase64,
        ticketUrl: proposal.ticketUrl,
        invoiceFile: proposal.invoiceFile,
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

  async findByProviderId(providerId: string): Promise<Proposal[]> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.providerId, providerId))
      .orderBy(proposalsSchema.createdAt);

    return result.map(this.mapToEntity);
  }

  async findByClientId(clientId: string): Promise<Proposal[]> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.clientId, clientId))
      .orderBy(proposalsSchema.createdAt);

    return result.map(this.mapToEntity);
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

  async findCompletedByServiceAndClient(
    serviceId: string,
    clientId: string,
  ): Promise<Proposal | null> {
    const result = await this.drizzleService.db
      .select({ proposal: proposalsSchema })
      .from(proposalsSchema)
      .innerJoin(
        budgetRequestsSchema,
        eq(proposalsSchema.requestId, budgetRequestsSchema.id),
      )
      .where(
        and(
          eq(budgetRequestsSchema.serviceId, serviceId),
          eq(proposalsSchema.clientId, clientId),
          eq(proposalsSchema.status, ProposalStatus.COMPLETED),
        ),
      )
      .limit(1);

    return result[0] ? this.mapToEntity(result[0].proposal) : null;
  }

  private mapToEntity(row: any): Proposal {
    return Proposal.restore({
      id: row.id,
      requestId: row.requestId,
      clientId: row.clientId,
      providerId: row.providerId,
      amount: parseFloat(row.amount),
      status: row.status as ProposalStatus,
      rejectionReason: row.rejectionReason ?? undefined,
      linkedChatId: row.linkedChatId ?? undefined,
      canResubmit: row.canResubmit,
      paymentId: row.paymentId ?? undefined,
      qrCode: row.qrCode ?? undefined,
      qrCodeBase64: row.qrCodeBase64 ?? undefined,
      ticketUrl: row.ticketUrl ?? undefined,
      invoiceFile: row.invoiceFile ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

@Injectable()
export class DrizzleNegotiationMessageRepository
  implements NegotiationMessageRepository
{
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(message: NegotiationMessage): Promise<NegotiationMessage> {
    const [inserted] = await this.drizzleService.db
      .insert(negotiationMessagesSchema)
      .values({
        proposalId: message.proposalId,
        senderRole: message.senderRole,
        senderUserId: message.senderUserId,
        message: message.message,
        revisedAmount: message.revisedAmount?.toString(),
        createdAt: new Date(),
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async findByProposalId(proposalId: string): Promise<NegotiationMessage[]> {
    const result = await this.drizzleService.db
      .select()
      .from(negotiationMessagesSchema)
      .where(eq(negotiationMessagesSchema.proposalId, proposalId))
      .orderBy(negotiationMessagesSchema.createdAt);

    return result.map(this.mapToEntity);
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
      revisedAmount: row.revisedAmount ? parseFloat(row.revisedAmount) : undefined,
      createdAt: row.createdAt,
    });
  }
}
