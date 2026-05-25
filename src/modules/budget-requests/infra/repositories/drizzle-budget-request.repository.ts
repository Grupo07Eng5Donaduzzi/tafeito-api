import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { BudgetRequestRepository } from '../../domain/repositories/budget-request-repository.interface';
import { BudgetRequest } from '../../domain/models/budget-request.entity';
import { budgetRequestsSchema } from '../schemas/budget-request.schema';
import { and, eq } from 'drizzle-orm';


@Injectable()
export class DrizzleBudgetRequestRepository implements BudgetRequestRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(budgetRequest: BudgetRequest): Promise<void> {
    await this.drizzleService.db.insert(budgetRequestsSchema).values({
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
    });
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
  ): Promise<BudgetRequest[]> {
    const rows = await this.drizzleService.db
      .select()
      .from(budgetRequestsSchema)
      .where(
        and(
          eq(budgetRequestsSchema.serviceId, serviceId),
          eq(budgetRequestsSchema.status, 'pending'),
        ),
      );

    return rows.map((row) => BudgetRequest.restore(row)!);
  }
}

