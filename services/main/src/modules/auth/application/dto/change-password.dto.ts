import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual do usuário' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'Nova senha', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Senha deve conter maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)',
  })
  newPassword: string;

  @ApiProperty({ description: 'Confirmação da nova senha' })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword: string;
}
