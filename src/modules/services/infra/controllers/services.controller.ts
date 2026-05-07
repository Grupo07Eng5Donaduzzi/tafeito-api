import {
  Controller,
  Get,
  Query,
  Delete,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  Body,
} from '@nestjs/common';
import { ServiceService } from '../../application/services/service.service';
import { CreateServiceDto } from '../../application/dto/create-service.dto';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  async create(@Body() body: CreateServiceDto): Promise<any> {
    return this.serviceService.create(body);
  }

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

  @Put('/update/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateServiceDto,
  ): Promise<any> {
    return this.serviceService.edit(id, body);
  }
}