import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePixPaymentDto {
  @IsNotEmpty()
  amount!: number | string;

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
  @MaxLength(18)
  payerDocumentNumber!: string;
}
