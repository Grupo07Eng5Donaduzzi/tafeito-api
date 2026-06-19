import { BudgetRequest } from '../models/budget-request.entity';

export const BUDGET_REQUEST_REPOSITORY = Symbol('BudgetRequestRepository');

export interface BudgetRequestRepository {
  create(budgetRequest: BudgetRequest): Promise<void>;
  update(budgetRequest: BudgetRequest): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<BudgetRequest | null>;
  findByUserId(userId: string): Promise<BudgetRequest[]>;
  findAvailableByServiceId(serviceId: string, providerId: string): Promise<BudgetRequest[]>;
  findAll(): Promise<BudgetRequest[]>;
  declineByProvider(budgetRequestId: string, providerId: string): Promise<void>;
}

