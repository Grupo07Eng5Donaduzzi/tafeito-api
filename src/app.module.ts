import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [SharedModule, UsersModule, AuthModule, ServicesModule, ChatModule],
})
export class AppModule {}
