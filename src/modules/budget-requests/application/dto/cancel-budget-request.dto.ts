import { IsString, MaxLength } from 'class-validator';

export class CancelBudgetRequestDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
