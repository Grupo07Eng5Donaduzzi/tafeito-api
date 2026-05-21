import { Body, Controller, Patch, Post } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { AuthResponseDto } from '../../application/dto/auth-response.dto';
import { LoginUserDto } from '../../application/dto/login-user.dto';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { BecomeProviderDto } from '../../application/dto/become-provider.dto';

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

  @Post('register')
  async register(@Body() body: CreateUserDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.register(body);
    return new AuthResponseDto(accessToken, user);
  }

  @Patch('become-provider')
  async becomeProvider(
    @CurrentUser() userId: string,
    @Body() body: BecomeProviderDto,
  ) {
    return this.authService.becomeProvider(userId, body.pixKey);
  }
}
