export class CreateBudgetRequestDto {
  serviceId!: string;
  title!: string;
  description!: string;
  category!: string;
  location!: string;
  requestDate!: Date;
  photos?: string[];
}
