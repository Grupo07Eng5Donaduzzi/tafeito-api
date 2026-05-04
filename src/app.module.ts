import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { BudgetRequestsModule } from './modules/budget-requests/budget-requests.module';

@Module({
  imports: [SharedModule, UsersModule, AuthModule, ServicesModule, BudgetRequestsModule],
})
export class AppModule {}
