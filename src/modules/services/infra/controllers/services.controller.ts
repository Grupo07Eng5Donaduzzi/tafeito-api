import {
  Controller,
  Get,
  Query,
  Delete,
  Param,
  ParseUUIDPipe,
  Put,
  Body,
} from '@nestjs/common';
import { ServiceService } from '../../application/services/service.service';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';
import { PaginationQueryDto } from '@shared/application/dto/pagination-query.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll(
    @Query('category') category: string | undefined,
    @Query() query: PaginationQueryDto,
  ) {
    if (category) {
      return this.serviceService.listByCategory(category, query.page, query.pageSize);
    }
    return this.serviceService.listAll(query.page, query.pageSize);
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
