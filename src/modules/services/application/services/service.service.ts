import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleServiceRepository } from '../../infra/repositories/drizzle-service.repository';

@Injectable()
export class ServiceService {
  constructor(private readonly repository: DrizzleServiceRepository) {}

  async listAll(): Promise<any[]> {
    return await this.repository.findAll();
  }

  async listByCategory(category: string): Promise<any[]> {
    return await this.repository.findByCategory(category);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Service not found');
    }
    await this.repository.deleteById(id);
  }
}