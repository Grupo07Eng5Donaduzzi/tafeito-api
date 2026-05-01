import { Module } from '@nestjs/common';
import { BudgetRequestsController } from './infra/controllers/budget-requests.controller';
import { BudgetRequestService } from './application/services/budget-request.service';
import { DrizzleBudgetRequestRepository } from './infra/repositories/drizzle-budget-request.repository';
import { BUDGET_REQUEST_REPOSITORY } from './domain/repositories/budget-request-repository.interface';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [BudgetRequestsController],
  providers: [
    BudgetRequestService,
    DrizzleBudgetRequestRepository,
    {
      provide: BUDGET_REQUEST_REPOSITORY,
      useExisting: DrizzleBudgetRequestRepository,
    },
  ],
  exports: [BudgetRequestService],
})
export class BudgetRequestsModule {}
