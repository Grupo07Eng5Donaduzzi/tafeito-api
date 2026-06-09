import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BecomeProviderDto {
  @ApiProperty({ example: 'joao@pix.com', description: 'Chave Pix do prestador' })
  @IsString()
  @IsNotEmpty()
  pixKey: string;

  @ApiProperty({ example: 50, description: 'Valor por hora em reais' })
  @IsNumber()
  @IsPositive()
  hourlyRate: number;
}
