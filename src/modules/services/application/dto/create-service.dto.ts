import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Manutenção elétrica' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Serviço de instalação e reparo elétrico residencial' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Elétrica' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '150.00', description: 'Preço base do serviço' })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiPropertyOptional({ example: '2h', description: 'Duração estimada' })
  @IsOptional()
  @IsString()
  duration?: string;
}
