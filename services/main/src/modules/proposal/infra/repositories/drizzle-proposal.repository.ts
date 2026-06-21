import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Proposal, ProposalStatus } from '../../domain/models/proposal.entity';
import { ProposalRepository } from '../../domain/repositories/proposal-repository.interface';
import { proposalsSchema } from '../schemas/proposal.schema';
import { alias } from 'drizzle-orm/pg-core';
import { eq, and } from 'drizzle-orm';
import { budgetRequestsSchema } from '../../../budget-requests/infra/schemas/budget-request.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';
import { usersSchema } from '@users/infra/schemas/user.schema';

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

  async findNegotiatingBetween(clientId: string, providerId: string): Promise<Proposal[]> {
    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(
        and(
          eq(proposalsSchema.clientId, clientId),
          eq(proposalsSchema.providerId, providerId),
          eq(proposalsSchema.status, ProposalStatus.NEGOTIATING),
        ),
      )
      .orderBy(proposalsSchema.updatedAt);

    return result.map(this.mapToEntity);
  }

  async findByProviderIdWithDetails(providerId: string): Promise<any[]> {
    const clientUser = alias(usersSchema, 'client_user');
    return this.drizzleService.db
      .select({
        id: proposalsSchema.id,
        requestId: proposalsSchema.requestId,
        clientId: proposalsSchema.clientId,
        providerId: proposalsSchema.providerId,
        amount: proposalsSchema.amount,
        status: proposalsSchema.status,
        rejectionReason: proposalsSchema.rejectionReason,
        canResubmit: proposalsSchema.canResubmit,
        paymentId: proposalsSchema.paymentId,
        qrCode: proposalsSchema.qrCode,
        qrCodeBase64: proposalsSchema.qrCodeBase64,
        ticketUrl: proposalsSchema.ticketUrl,
        invoiceFile: proposalsSchema.invoiceFile,
        createdAt: proposalsSchema.createdAt,
        updatedAt: proposalsSchema.updatedAt,
        brTitle: budgetRequestsSchema.title,
        brServiceId: budgetRequestsSchema.serviceId,
        svcId: servicesSchema.id,
        svcName: servicesSchema.name,
        clientUserId: clientUser.id,
        clientUserName: clientUser.name,
      })
      .from(proposalsSchema)
      .innerJoin(budgetRequestsSchema, eq(proposalsSchema.requestId, budgetRequestsSchema.id))
      .innerJoin(servicesSchema, eq(budgetRequestsSchema.serviceId, servicesSchema.id))
      .leftJoin(clientUser, eq(budgetRequestsSchema.userId, clientUser.id))
      .where(eq(proposalsSchema.providerId, providerId))
      .orderBy(proposalsSchema.createdAt);
  }

  async findByClientIdWithDetails(clientId: string): Promise<any[]> {
    const providerUser = alias(usersSchema, 'provider_user');
    return this.drizzleService.db
      .select({
        id: proposalsSchema.id,
        requestId: proposalsSchema.requestId,
        clientId: proposalsSchema.clientId,
        providerId: proposalsSchema.providerId,
        amount: proposalsSchema.amount,
        status: proposalsSchema.status,
        rejectionReason: proposalsSchema.rejectionReason,
        canResubmit: proposalsSchema.canResubmit,
        paymentId: proposalsSchema.paymentId,
        qrCode: proposalsSchema.qrCode,
        qrCodeBase64: proposalsSchema.qrCodeBase64,
        ticketUrl: proposalsSchema.ticketUrl,
        invoiceFile: proposalsSchema.invoiceFile,
        createdAt: proposalsSchema.createdAt,
        updatedAt: proposalsSchema.updatedAt,
        brTitle: budgetRequestsSchema.title,
        brServiceId: budgetRequestsSchema.serviceId,
        svcId: servicesSchema.id,
        svcName: servicesSchema.name,
        providerUserId: providerUser.id,
        providerUserName: providerUser.name,
      })
      .from(proposalsSchema)
      .innerJoin(budgetRequestsSchema, eq(proposalsSchema.requestId, budgetRequestsSchema.id))
      .innerJoin(servicesSchema, eq(budgetRequestsSchema.serviceId, servicesSchema.id))
      .leftJoin(providerUser, eq(proposalsSchema.providerId, providerUser.id))
      .where(eq(proposalsSchema.clientId, clientId))
      .orderBy(proposalsSchema.createdAt);
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
