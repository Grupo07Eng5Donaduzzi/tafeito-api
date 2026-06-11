import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SharedModule } from '@shared/shared.module';
import { HateoasInterceptor } from '@shared/infra/hateoas';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/infra/guards/auth.guard';
import { ServicesModule } from './modules/services/services.module';
import { BudgetRequestsModule } from './modules/budget-requests/budget-requests.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    SharedModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    BudgetRequestsModule,
    ProposalModule,
    ReviewsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HateoasInterceptor,
    },
  ],
})
export class AppModule {}
