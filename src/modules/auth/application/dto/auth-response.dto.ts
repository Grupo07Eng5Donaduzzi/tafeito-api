import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '@users/application/dto/user.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT de acesso' })
  accessToken: string;

  @ApiProperty({ type: () => UserDto })
  user: UserDto;

  constructor(accessToken: string, user: UserDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}
