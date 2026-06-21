import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '../users/users.module';
import { AdminService } from './application/services/admin.service';
import { AdminAuthService } from './application/services/admin-auth.service';
import { AdminController } from './infra/controllers/admin.controller';
import { AdminAuthController } from './infra/controllers/admin-auth.controller';
import { AdminGuard } from './infra/guards/admin.guard';

@Module({
  imports: [SharedModule, UsersModule],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminGuard],
})
export class AdminModule {}
