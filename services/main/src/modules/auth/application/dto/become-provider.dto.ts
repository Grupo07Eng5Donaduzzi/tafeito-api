import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BecomeProviderDto {
  @ApiProperty({ example: 'joao@pix.com', description: 'Chave Pix do prestador' })
  @IsString()
  @IsNotEmpty()
  pixKey: string;
}
