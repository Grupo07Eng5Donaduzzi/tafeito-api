import { Controller, Get, Query, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { ServiceService } from '../../application/services/service.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll(@Query('category') category?: string): Promise<any[]> {
    if (category) {
      return this.serviceService.listByCategory(category);
    }
    return this.serviceService.listAll();
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serviceService.remove(id);
  }
}