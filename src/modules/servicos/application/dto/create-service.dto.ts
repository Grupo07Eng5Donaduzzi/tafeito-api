import { IsString, IsEnum, IsNumber, IsNotEmpty, Min, MaxLength } from "class-validator";
import { ServiceCategory } from "@servicos/domain/models/service.entity";

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;

  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state!: string;

  // O providerId virá do token JWT, não do body
}

export class UpdateServiceDto {
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsNumber()
  @Min(0)
  price?: number;

  @IsString()
  @MaxLength(255)
  address?: string;

  @IsString()
  @MaxLength(100)
  city?: string;

  @IsString()
  @MaxLength(2)
  state?: string;
}