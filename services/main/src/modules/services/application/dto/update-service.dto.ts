import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PricingType } from './create-service.dto';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Plantio de flores e plantas' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'Realizo o plantio de flores, plantas e árvores.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ example: 'Jardinagem' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({ example: '100.00' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  price?: string;

  @ApiPropertyOptional({ enum: PricingType, example: PricingType.DAILY })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;
}
