import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [SharedModule, UsersModule, AuthModule],
})
export class AppModule {}
