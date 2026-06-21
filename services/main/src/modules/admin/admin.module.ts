import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '../users/users.module';
import { AdminService } from './application/services/admin.service';
import { AdminAuthService } from './application/services/admin-auth.service';
import { AdminController } from './infra/controllers/admin.controller';
import { AdminAuthController } from './infra/controllers/admin-auth.controller';
import { AdminGuard } from './infra/guards/admin.guard';
import { ChatDrizzleService } from './infra/database/chat-drizzle.service';

@Module({
  imports: [SharedModule, UsersModule],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminGuard, ChatDrizzleService],
})
export class AdminModule {}
