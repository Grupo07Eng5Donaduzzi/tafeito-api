import { Schedule } from '../models/schedule.entity';

export const SCHEDULE_REPOSITORY = Symbol('ScheduleRepository');

export interface ScheduleRepository {
  create(schedule: Schedule): Promise<void>;
  findById(id: string): Promise<Schedule | null>;
  findByBudgetRequestId(budgetRequestId: string): Promise<Schedule | null>;
}
