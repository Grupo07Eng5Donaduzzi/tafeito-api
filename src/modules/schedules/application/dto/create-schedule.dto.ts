import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'uuid-da-proposta' })
  @IsUUID()
  proposalId!: string;

  @ApiProperty({ example: 'uuid-do-pedido-de-orcamento' })
  @IsUUID()
  budgetRequestId!: string;
}
