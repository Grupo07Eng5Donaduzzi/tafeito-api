import { IsUUID } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  proposalId!: string;

  @IsUUID()
  budgetRequestId!: string;
}
