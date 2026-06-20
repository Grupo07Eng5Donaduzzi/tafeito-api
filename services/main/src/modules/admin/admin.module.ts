import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { AdminService } from './application/services/admin.service';
import { AdminController } from './infra/controllers/admin.controller';
import { AdminGuard } from './infra/guards/admin.guard';
import { ChatDrizzleService } from './infra/database/chat-drizzle.service';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, ChatDrizzleService],
})
export class AdminModule {}
