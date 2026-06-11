import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PricingType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
}

export class CreateServiceDto {
  @ApiProperty({ example: 'Plantio de flores e plantas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Realizo o plantio de flores, plantas e árvores com cuidado e dedicação.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Jardinagem' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '100.00', description: 'Preço base do serviço' })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({ enum: PricingType, example: PricingType.DAILY, description: 'Método de cobrança' })
  @IsEnum(PricingType)
  pricingType: PricingType;
}
