import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { BudgetRequestsModule } from './modules/budget-requests/budget-requests.module';
import { ChatModule } from './modules/chat/chat.module';
import { ContestacaoModule } from './modules/proposal/contestacao.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    SharedModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    BudgetRequestsModule,
    ChatModule,
    ContestacaoModule,
    PaymentsModule,
    InvoicesModule,
    ReviewsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
