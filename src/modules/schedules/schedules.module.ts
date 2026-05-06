import { Module } from '@nestjs/common';
import { SchedulesController } from './infra/controllers/schedules.controller';
import { ScheduleService } from './application/services/schedule.service';
import { DrizzleScheduleRepository } from './infra/repositories/drizzle-schedule.repository';
import { SCHEDULE_REPOSITORY } from './domain/repositories/schedule-repository.interface';
import { SharedModule } from '@shared/shared.module';
import { BudgetRequestsModule } from '../budget-requests/budget-requests.module';

@Module({
  imports: [SharedModule, BudgetRequestsModule],
  controllers: [SchedulesController],
  providers: [
    ScheduleService,
    DrizzleScheduleRepository,
    {
      provide: SCHEDULE_REPOSITORY,
      useExisting: DrizzleScheduleRepository,
    },
  ],
})
export class SchedulesModule {}
