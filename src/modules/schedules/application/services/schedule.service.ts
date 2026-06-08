import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { SCHEDULE_REPOSITORY } from '../../domain/repositories/schedule-repository.interface';
import type { ScheduleRepository } from '../../domain/repositories/schedule-repository.interface';
import { Schedule } from '../../domain/models/schedule.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { ScheduleDto } from '../dto/schedule.dto';
import { ProposalService } from '../../../proposal/application/services/proposal.service';
import { ProposalStatus } from '../../../proposal/domain/models/proposal.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly repository: ScheduleRepository,
    @Inject(forwardRef(() => ProposalService))
    private readonly proposalService: ProposalService,
  ) {}

  async create(dto: CreateScheduleDto): Promise<ScheduleDto> {
    const proposal = await this.proposalService.getProposal(dto.proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== ProposalStatus.ACCEPTED) {
      throw new BadRequestException('Scheduling is only allowed for accepted proposals');
    }
    if (proposal.requestId !== dto.budgetRequestId) {
      throw new BadRequestException('budgetRequestId does not match the proposal');
    }

    const existing = await this.repository.findByProposalId(dto.proposalId);
    if (existing) {
      throw new BadRequestException('A schedule already exists for this proposal');
    }

    const schedule = new Schedule({
      proposalId: dto.proposalId,
      budgetRequestId: dto.budgetRequestId,
    });
    await this.repository.create(schedule);
    return this.toDto(schedule);
  }

  async findById(id: string): Promise<ScheduleDto | null> {
    const result = await this.repository.findById(id);
    return result ? this.toDto(result) : null;
  }

  async findByProposalId(proposalId: string): Promise<ScheduleDto | null> {
    const result = await this.repository.findByProposalId(proposalId);
    return result ? this.toDto(result) : null;
  }

  private toDto(s: Schedule): ScheduleDto {
    return {
      id: s.id!,
      proposalId: s.proposalId,
      budgetRequestId: s.budgetRequestId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
