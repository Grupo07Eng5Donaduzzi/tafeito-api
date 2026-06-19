import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    if (!trimmed) throw new BadRequestException(`${fieldName} não pode estar vazio`);
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

  async create(userId: string, dto: CreateServiceDto): Promise<any> {
    const name = this.validateNonEmptyString(dto.name, 'name');
    const description = this.validateNonEmptyString(dto.description, 'description');
    const category = this.validateNonEmptyString(dto.category, 'category');
    const price = this.validatePositiveNumberString(dto.price, 'price');

    return this.repository.create({
      userId,
      name,
      description,
      category,
      price,
      pricingType: dto.pricingType,
    });
  }

  async findByIdWithDetails(id: string): Promise<any> {
    const result = await this.repository.findByIdWithDetails(id);
    if (!result) throw new NotFoundException('Serviço não encontrado');
    return result;
  }

  async listAll(): Promise<any[]> {
    return this.repository.findAll();
  }

  async listMine(userId: string): Promise<any[]> {
    return this.repository.findByUserId(userId);
  }

  async listCategories(): Promise<string[]> {
    return this.repository.findDistinctCategories();
  }

  async listPaginated(params: { page: number; limit: number; category?: string }) {
    const { page, limit, category } = params;
    const offset = (page - 1) * limit;
    const { data, total } = await this.repository.findAllPaginated({ limit, offset, category });
    return { data, total, page, limit };
  }

  async listByCategory(category: string): Promise<any[]> {
    return this.repository.findByCategory(category);
  }

  async uploadPhoto(id: string, userId: string, filename: string): Promise<any> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Serviço não encontrado');
    if (existing.userId !== userId) {
      throw new ForbiddenException('Apenas o dono do serviço pode adicionar fotos');
    }
    await this.repository.updateById(id, { photo: filename });
    return this.repository.findById(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Serviço não encontrado');
    if (existing.userId !== userId) {
      throw new ForbiddenException('Apenas o dono do serviço pode excluí-lo');
    }
    await this.repository.deleteById(id);
  }

  async edit(id: string, userId: string, dto: UpdateServiceDto): Promise<any> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Serviço não encontrado');
    if (existing.userId !== userId) {
      throw new ForbiddenException('Apenas o dono do serviço pode editá-lo');
    }

    const payload: UpdateServiceDto = {};

    if (dto.name !== undefined)
      payload.name = this.validateNonEmptyString(dto.name, 'name');
    if (dto.description !== undefined)
      payload.description = this.validateNonEmptyString(dto.description, 'description');
    if (dto.category !== undefined)
      payload.category = this.validateNonEmptyString(dto.category, 'category');
    if (dto.price !== undefined)
      payload.price = this.validatePositiveNumberString(dto.price, 'price');
    if (dto.pricingType !== undefined)
      payload.pricingType = dto.pricingType;
    if (dto.userId !== undefined) {
      const newUserId = this.validateNonEmptyString(dto.userId, 'userId');
      if (!this.isValidUuid(newUserId)) throw new BadRequestException('userId deve ser um UUID válido');
      payload.userId = newUserId;
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Pelo menos um campo deve ser informado para atualização');
    }

    await this.repository.updateById(id, payload);
    return this.repository.findById(id);
  }
}
