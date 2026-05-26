import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BudgetRequestRepository } from '../../domain/repositories/budget-request-repository.interface';
import { BUDGET_REQUEST_REPOSITORY } from '../../domain/repositories/budget-request-repository.interface';
import { BudgetRequest } from '../../domain/models/budget-request.entity';
import { CreateBudgetRequestDto } from '../dto/create-budget-request.dto';
import { CancelBudgetRequestDto } from '../dto/cancel-budget-request.dto';
import { BudgetRequestDto } from '../dto/budget-request.dto';
import { PaginatedResponseDto } from '@shared/application/dto/paginated-response.dto';

@Injectable()
export class BudgetRequestService {
  constructor(
    @Inject(BUDGET_REQUEST_REPOSITORY)
    private readonly repository: BudgetRequestRepository,
  ) {}

  async create(
    userId: string,
    dto: CreateBudgetRequestDto,
  ): Promise<BudgetRequestDto> {
    const budgetRequest = new BudgetRequest({
      userId,
      serviceId: dto.serviceId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      location: dto.location,
      requestDate: dto.requestDate,
      status: 'pending',
      photos: dto.photos,
    });
    await this.repository.create(budgetRequest);
    return this.toDto(budgetRequest);
  }

  async findAll(): Promise<BudgetRequestDto[]> {
    const result = await this.repository.findAll();
    return result.map((s) => this.toDto(s));
  }

  async findById(id: string): Promise<BudgetRequestDto | null> {
    const result = await this.repository.findById(id);
    return result ? this.toDto(result) : null;
  }

  async findByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponseDto<BudgetRequestDto>> {
    const { data, total } = await this.repository.findByUserId(userId, page, pageSize);
    return PaginatedResponseDto.of(
      data.map((s) => this.toDto(s)),
      total,
      page,
      pageSize,
    );
  }

  async findAvailableByServiceId(serviceId: string): Promise<BudgetRequestDto[]> {
    if (!serviceId || serviceId.trim().length === 0) {
      throw new BadRequestException('serviceId é obrigatório');
    }

    const result = await this.repository.findAvailableByServiceId(serviceId);
    return result.map((s) => this.toDto(s));
  }

  async cancel(id: string, dto: CancelBudgetRequestDto): Promise<void> {
    const budgetRequest = await this.repository.findById(id);
    if (!budgetRequest) throw new NotFoundException('Proposta não encontrada');
    if (budgetRequest.status !== 'pending') {
      throw new BadRequestException(
        'Cancelamento permitido apenas para propostas com status pendente',
      );
    }
    budgetRequest.status = 'cancelled';
    budgetRequest.cancellationReason = dto.reason;
    budgetRequest.updatedAt = new Date();
    await this.repository.update(budgetRequest);
  }


  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toDto(s: BudgetRequest): BudgetRequestDto {
    return {
      id: s.id!,
      userId: s.userId,
      serviceId: s.serviceId,
      title: s.title,
      description: s.description,
      category: s.category,
      location: s.location,
      requestDate: s.requestDate,
      status: s.status,
      photos: s.photos,
      cancellationReason: s.cancellationReason,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}
