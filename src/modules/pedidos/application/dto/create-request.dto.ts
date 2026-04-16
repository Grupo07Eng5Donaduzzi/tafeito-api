import { IsString, IsEnum, IsNotEmpty, IsOptional, IsArray, IsNumber, MaxLength, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { RequestCategory } from "@pedidos/domain/models/request.entity";

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  detailedDescription!: string;

  @IsEnum(RequestCategory)
  category!: RequestCategory;

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

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  detailedDescription?: string;

  @IsOptional()
  @IsEnum(RequestCategory)
  category?: RequestCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}