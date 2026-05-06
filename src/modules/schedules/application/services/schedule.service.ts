import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SCHEDULE_REPOSITORY, ScheduleRepository } from '../../domain/repositories/schedule-repository.interface';
import { Schedule } from '../../domain/models/schedule.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { ScheduleDto } from '../dto/schedule.dto';
import { BudgetRequestService } from '../../../budget-requests/application/services/budget-request.service';

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly repository: ScheduleRepository,
    private readonly budgetRequestService: BudgetRequestService,
  ) {}

  async create(dto: CreateScheduleDto): Promise<ScheduleDto> {
    const budgetRequest = await this.budgetRequestService.findById(dto.budgetRequestId);
    if (!budgetRequest) throw new NotFoundException('Proposta não encontrada');
    if (budgetRequest.status !== 'accepted') {
      throw new BadRequestException('Agendamento permitido apenas para propostas aceitas');
    }

    const existing = await this.repository.findByBudgetRequestId(dto.budgetRequestId);
    if (existing) {
      throw new BadRequestException('Já existe um agendamento para esta proposta');
    }

    const schedule = new Schedule({
      budgetRequestId: dto.budgetRequestId,
      scheduledDate: new Date(dto.scheduledDate),
    });
    await this.repository.create(schedule);
    return this.toDto(schedule);
  }

  async findById(id: string): Promise<ScheduleDto | null> {
    const result = await this.repository.findById(id);
    return result ? this.toDto(result) : null;
  }

  async findByBudgetRequestId(budgetRequestId: string): Promise<ScheduleDto | null> {
    const result = await this.repository.findByBudgetRequestId(budgetRequestId);
    return result ? this.toDto(result) : null;
  }

  private toDto(s: Schedule): ScheduleDto {
    return {
      id: s.id!,
      budgetRequestId: s.budgetRequestId,
      scheduledDate: s.scheduledDate,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
