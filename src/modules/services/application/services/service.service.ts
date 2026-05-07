import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleServiceRepository } from '../../infra/repositories/drizzle-service.repository';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly repository: DrizzleServiceRepository) {}

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private validateNonEmptyString(value: string, fieldName: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException(`${fieldName} não pode estar vazio`);
    }
    return trimmed;
  }

  private validatePositiveNumberString(value: string, fieldName: string): string {
    const trimmed = value.trim();
    const parsed = Number(trimmed);

    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new BadRequestException(`${fieldName} deve ser um número positivo`);
    }

    return trimmed;
  }

  async listAll(): Promise<any[]> {
    return await this.repository.findAll();
  }

  async listByCategory(category: string): Promise<any[]> {
    return await this.repository.findByCategory(category);
  }

  async create(dto: CreateServiceDto): Promise<any> {
    const userId = this.validateNonEmptyString(dto.userId, 'userId');
    if (!this.isValidUuid(userId)) {
      throw new BadRequestException('userId deve ser um UUID válido');
    }

    const service = {
      userId,
      name: this.validateNonEmptyString(dto.name, 'name'),
      description: this.validateNonEmptyString(dto.description, 'description'),
      category: this.validateNonEmptyString(dto.category, 'category'),
      price: this.validatePositiveNumberString(dto.price, 'price'),
      duration: this.validatePositiveNumberString(dto.duration, 'duration'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.repository.create(service);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Serviço não encontrado');
    }
    await this.repository.deleteById(id);
  }

  async edit(id: string, dto: UpdateServiceDto): Promise<any> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const payload: UpdateServiceDto = {};

    if (dto.name !== undefined) {
      payload.name = this.validateNonEmptyString(dto.name, 'name');
    }

    if (dto.description !== undefined) {
      payload.description = this.validateNonEmptyString(dto.description, 'description');
    }

    if (dto.category !== undefined) {
      payload.category = this.validateNonEmptyString(dto.category, 'category');
    }

    if (dto.price !== undefined) {
      payload.price = this.validatePositiveNumberString(dto.price, 'price');
    }

    if (dto.duration !== undefined) {
      payload.duration = this.validatePositiveNumberString(dto.duration, 'duration');
    }

    if (dto.userId !== undefined) {
      const userId = this.validateNonEmptyString(dto.userId, 'userId');
      if (!this.isValidUuid(userId)) {
        throw new BadRequestException('userId deve ser um UUID válido');
      }
      payload.userId = userId;
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Pelo menos um campo deve ser informado para atualização');
    }

    await this.repository.updateById(id, payload);
    return this.repository.findById(id);
  }
}