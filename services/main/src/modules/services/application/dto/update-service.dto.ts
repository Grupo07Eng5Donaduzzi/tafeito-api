import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Manutenção elétrica' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'Serviço de instalação e reparo elétrico residencial' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ example: 'Elétrica' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({ example: '150.00' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  price?: string;

  @ApiPropertyOptional({ example: '2h' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;
}
