import { UserDto } from '@users/application/dto/user.dto';

export class AuthResponseDto {
  accessToken: string;
  user: UserDto;

  constructor(accessToken: string, user: UserDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}
