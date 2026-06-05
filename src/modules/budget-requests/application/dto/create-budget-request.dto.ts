import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateBudgetRequestDto {
  @ApiProperty({ example: 'uuid-do-servico' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ example: 'Instalação de tomadas' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Preciso instalar 5 tomadas na sala' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Elétrica' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'Rua das Flores, 123 - São Paulo, SP' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: '2026-07-01T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  requestDate!: Date;

  @ApiPropertyOptional({ type: [String], example: ['https://exemplo.com/foto1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
