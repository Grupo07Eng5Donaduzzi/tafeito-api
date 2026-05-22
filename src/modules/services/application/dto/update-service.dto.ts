import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  price?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}