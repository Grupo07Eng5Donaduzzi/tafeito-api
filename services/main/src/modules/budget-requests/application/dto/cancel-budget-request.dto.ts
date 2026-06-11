import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelBudgetRequestDto {
  @ApiProperty({ example: 'Serviço não é mais necessário' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
