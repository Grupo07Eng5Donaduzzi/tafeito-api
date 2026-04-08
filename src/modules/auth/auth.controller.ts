import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginUserDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(
      body.email,
      body.password,
    );

    return new AuthResponseDto(accessToken, user);
  }
}
