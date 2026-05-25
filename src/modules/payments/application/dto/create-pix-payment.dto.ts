import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePixPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEmail()
  @MaxLength(254)
  payerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payerLastName?: string;

  @IsEnum(['CPF', 'CNPJ'])
  payerDocumentType!: 'CPF' | 'CNPJ';

  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  payerDocumentNumber!: string;
}
