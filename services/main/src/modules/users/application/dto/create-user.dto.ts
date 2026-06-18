import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Senha deve conter maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)',
  })
  password: string;

  @ApiProperty({ example: '123.456.789-00', description: 'CPF ou CNPJ' })
  @IsString()
  @IsNotEmpty()
  identification: string;

  @ApiPropertyOptional({ example: 'joao@pix.com' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pixKey?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ example: 'Senha@123', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Senha deve conter maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)',
  })
  password?: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  identification?: string;

  @ApiPropertyOptional({ example: 'joao@pix.com' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pixKey?: string;
}
