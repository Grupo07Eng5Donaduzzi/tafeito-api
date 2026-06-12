import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from '@shared/shared.module';
import { ChatModule } from './modules/chat/chat.module';
import { JwtAuthGuard } from '@shared/infra/guards/jwt-auth.guard';

@Module({
  imports: [SharedModule, ChatModule],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
