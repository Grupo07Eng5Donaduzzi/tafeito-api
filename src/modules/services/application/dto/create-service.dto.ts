import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsNumberString({ no_symbols: false })
  @MaxLength(20)
  price: string;

  @IsNumberString()
  @MaxLength(20)
  duration: string;

  @IsUUID()
  userId: string;
}
