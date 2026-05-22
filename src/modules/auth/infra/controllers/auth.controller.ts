import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../../application/services/auth.service';
import { AuthResponseDto } from '../../application/dto/auth-response.dto';
import { LoginUserDto } from '../../application/dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: LoginUserDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(
      body.email,
      body.password,
    );

    return new AuthResponseDto(accessToken, user);
  }
}
