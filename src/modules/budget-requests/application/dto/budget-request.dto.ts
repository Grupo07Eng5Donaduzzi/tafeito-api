import { BudgetRequestStatus } from '../../domain/models/budget-request.entity';

export class BudgetRequestDto {
  id!: string;
  userId!: string;
  serviceId!: string;
  title!: string;
  description!: string;
  category!: string;
  location!: string;
  requestDate!: Date;
  status!: BudgetRequestStatus;
  photos?: string[];
  cancellationReason?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
