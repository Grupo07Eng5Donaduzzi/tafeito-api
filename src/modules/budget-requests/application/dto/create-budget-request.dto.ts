export class CreateBudgetRequestDto {
  userId!: string;
  serviceId!: string;
  description!: string;
  requestDate!: Date;
  photos?: string[];
}

