import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBudgetRequestDto {
  @IsUUID()
  serviceId!: string;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsString()
  @MaxLength(200)
  location!: string;

  @IsDateString()
  requestDate!: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
