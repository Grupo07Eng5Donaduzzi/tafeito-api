import { Module } from '@nestjs/common';
import { AuthController } from './infra/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { UsersModule } from '@users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
