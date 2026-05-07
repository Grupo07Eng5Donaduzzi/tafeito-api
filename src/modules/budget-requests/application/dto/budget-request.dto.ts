import { BudgetRequestStatus } from '../../domain/models/budget-request.entity';

export class BudgetRequestDto {
  id!: string;
  userId!: string;
  serviceId!: string;
  description!: string;
  requestDate!: Date;
  status!: BudgetRequestStatus;
  photos?: string[];
  cancellationReason?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

