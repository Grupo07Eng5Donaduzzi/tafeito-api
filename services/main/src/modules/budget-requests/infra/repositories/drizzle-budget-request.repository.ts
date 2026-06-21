import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { BudgetRequestRepository } from '../../domain/repositories/budget-request-repository.interface';
import { BudgetRequest } from '../../domain/models/budget-request.entity';
import { budgetRequestsSchema } from '../schemas/budget-request.schema';
import { providerDeclinesSchema } from '../schemas/provider-decline.schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

@Injectable()
export class DrizzleBudgetRequestRepository implements BudgetRequestRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(budgetRequest: BudgetRequest): Promise<void> {
    const [inserted] = await this.drizzleService.db
      .insert(budgetRequestsSchema)
      .values({
        userId: budgetRequest.userId,
        serviceId: budgetRequest.serviceId,
        title: budgetRequest.title,
        description: budgetRequest.description,
        category: budgetRequest.category,
        location: budgetRequest.location,
        requestDate: budgetRequest.requestDate,
        status: budgetRequest.status,
        photos: budgetRequest.photos,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: budgetRequestsSchema.id });
    budgetRequest.id = inserted.id;
  }

  async update(budgetRequest: BudgetRequest): Promise<void> {
    await this.drizzleService.db
      .update(budgetRequestsSchema)
      .set({
        userId: budgetRequest.userId,
        serviceId: budgetRequest.serviceId,
        title: budgetRequest.title,
        description: budgetRequest.description,
        category: budgetRequest.category,
        location: budgetRequest.location,
        requestDate: budgetRequest.requestDate,
        status: budgetRequest.status,
        photos: budgetRequest.photos,
        cancellationReason: budgetRequest.cancellationReason,
        updatedAt: new Date(),
      })
      .where(eq(budgetRequestsSchema.id, budgetRequest.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(budgetRequestsSchema)
      .where(eq(budgetRequestsSchema.id, id));
  }

  async findById(id: string): Promise<BudgetRequest | null> {
    const result = await this.drizzleService.db
      .select()
      .from(budgetRequestsSchema)
      .where(eq(budgetRequestsSchema.id, id))
      .limit(1);
    return BudgetRequest.restore(result[0]);
  }

  async findByUserId(userId: string): Promise<BudgetRequest[]> {
    const rows = await this.drizzleService.db
      .select()
      .from(budgetRequestsSchema)
      .where(eq(budgetRequestsSchema.userId, userId));
    return rows.map((row) => BudgetRequest.restore(row)!);
  }

  async findAll(): Promise<BudgetRequest[]> {
    const rows = await this.drizzleService.db
      .select()
      .from(budgetRequestsSchema);
    return rows.map((row) => BudgetRequest.restore(row)!);
  }

  async findAvailableByServiceId(
    serviceId: string,
    providerId: string,
  ): Promise<BudgetRequest[]> {
    const rows = await this.drizzleService.db
      .select({
        id: budgetRequestsSchema.id,
        userId: budgetRequestsSchema.userId,
        serviceId: budgetRequestsSchema.serviceId,
        title: budgetRequestsSchema.title,
        description: budgetRequestsSchema.description,
        category: budgetRequestsSchema.category,
        location: budgetRequestsSchema.location,
        requestDate: budgetRequestsSchema.requestDate,
        status: budgetRequestsSchema.status,
        photos: budgetRequestsSchema.photos,
        cancellationReason: budgetRequestsSchema.cancellationReason,
        createdAt: budgetRequestsSchema.createdAt,
        updatedAt: budgetRequestsSchema.updatedAt,
      })
      .from(budgetRequestsSchema)
      .leftJoin(
        providerDeclinesSchema,
        and(
          eq(providerDeclinesSchema.budgetRequestId, budgetRequestsSchema.id),
          eq(providerDeclinesSchema.providerId, providerId),
        ),
      )
      .where(
        and(
          eq(budgetRequestsSchema.serviceId, serviceId),
          eq(budgetRequestsSchema.status, 'pending'),
          isNull(providerDeclinesSchema.id),
          sql`${budgetRequestsSchema.id} NOT IN (
            SELECT request_id FROM proposals
            WHERE provider_id = ${providerId}::uuid
            AND status != 'CANCELLED'
          )`,
        ),
      );

    return rows.map((row) => BudgetRequest.restore(row)!);
  }

  async declineByProvider(budgetRequestId: string, providerId: string): Promise<void> {
    await this.drizzleService.db
      .insert(providerDeclinesSchema)
      .values({
        providerId,
        budgetRequestId,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }
}
