import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { ScheduleRepository } from '../../domain/repositories/schedule-repository.interface';
import { Schedule } from '../../domain/models/schedule.entity';
import { schedulesSchema } from '../schemas/schedule.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class DrizzleScheduleRepository implements ScheduleRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(schedule: Schedule): Promise<void> {
    await this.drizzleService.db.insert(schedulesSchema).values({
      proposalId: schedule.proposalId,
      budgetRequestId: schedule.budgetRequestId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findById(id: string): Promise<Schedule | null> {
    const result = await this.drizzleService.db
      .select()
      .from(schedulesSchema)
      .where(eq(schedulesSchema.id, id))
      .limit(1);
    return Schedule.restore(result[0]);
  }

  async findByProposalId(proposalId: string): Promise<Schedule | null> {
    const result = await this.drizzleService.db
      .select()
      .from(schedulesSchema)
      .where(eq(schedulesSchema.proposalId, proposalId))
      .limit(1);
    return Schedule.restore(result[0]);
  }
}
