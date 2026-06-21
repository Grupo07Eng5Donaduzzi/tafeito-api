import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AdminAuthService } from '../../application/services/admin-auth.service';

class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({ summary: 'Login exclusivo para administradores' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: AdminLoginDto) {
    return this.adminAuthService.login(body.email, body.password);
  }
}
