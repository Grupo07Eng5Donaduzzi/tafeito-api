import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { RequireProviderGuard } from '@shared/infra/guards/require-provider.guard';
import { HateoasList } from '@shared/infra/hateoas';
import { ServiceService } from '../../application/services/service.service';
import { CreateServiceDto } from '../../application/dto/create-service.dto';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';

@ApiTags('Services')
@ApiBearerAuth('access-token')
@Controller('services')
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) {}

  @ApiOperation({ summary: 'Listar serviços com paginação e filtro opcional por categoria' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get()
  @HateoasList({
    basePath: '/services',
    itemLinks: (item: any) => ({
      self: { href: `/services/${item.id}`, method: 'GET' },
      update: { href: `/services/${item.id}`, method: 'PUT' },
      delete: { href: `/services/${item.id}`, method: 'DELETE' },
      budgetRequests: { href: `/budgetRequests/available?service_id=${item.id}`, method: 'GET' },
    }),
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('category') category?: string,
  ) {
    return this.serviceService.listPaginated({ page, limit, category });
  }

  @Post()
  @UseGuards(RequireProviderGuard)
  async create(
    @CurrentUser() userId: string,
    @Body() body: CreateServiceDto,
  ): Promise<any> {
    return this.serviceService.create(userId, body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  @UseGuards(RequireProviderGuard)
  async update(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateServiceDto,
  ): Promise<void> {
    await this.serviceService.edit(id, userId, body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  @UseGuards(RequireProviderGuard)
  async remove(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.serviceService.remove(id, userId);
  }
}
