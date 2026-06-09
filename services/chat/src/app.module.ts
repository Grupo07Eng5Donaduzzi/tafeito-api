import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [SharedModule, ChatModule],
})
export class AppModule {}
