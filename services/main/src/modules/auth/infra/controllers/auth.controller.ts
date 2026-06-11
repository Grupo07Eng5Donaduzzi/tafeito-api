import { Body, Controller, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service';
import { AuthResponseDto } from '../../application/dto/auth-response.dto';
import { LoginUserDto } from '../../application/dto/login-user.dto';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { BecomeProviderDto } from '../../application/dto/become-provider.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Autenticar com e-mail e senha' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginUserDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(body.email, body.password);
    return new AuthResponseDto(accessToken, user);
  }

  @ApiOperation({ summary: 'Cadastrar um novo usuário' })
  @Post('register')
  async register(@Body() body: CreateUserDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.register(body);
    return new AuthResponseDto(accessToken, user);
  }

  @ApiOperation({ summary: 'Tornar-se prestador de serviço' })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('becomeProvider')
  async becomeProvider(
    @CurrentUser() userId: string,
    @Body() body: BecomeProviderDto,
  ): Promise<void> {
    await this.authService.becomeProvider(userId, body);
  }

  @ApiOperation({ summary: 'Enviar e-mail de recuperação de senha' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(body.email);
  }
}
