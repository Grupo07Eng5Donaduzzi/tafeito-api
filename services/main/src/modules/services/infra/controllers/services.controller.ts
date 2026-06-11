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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Listar todas as categorias de serviços cadastradas' })
  @Get('categories')
  async listCategories(): Promise<string[]> {
    return this.serviceService.listCategories();
  }

  @ApiOperation({ summary: 'Buscar detalhes de um serviço com provedor e avaliações' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.serviceService.findByIdWithDetails(id);
  }

  @ApiOperation({ summary: 'Criar um novo serviço (somente prestador)' })
  @Post()
  @UseGuards(RequireProviderGuard)
  async create(
    @CurrentUser() userId: string,
    @Body() body: CreateServiceDto,
  ): Promise<any> {
    return this.serviceService.create(userId, body);
  }

  @ApiOperation({ summary: 'Fazer upload da foto do serviço' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Foto do serviço (JPEG/PNG/WebP, máx 5 MB)',
        },
      },
    },
  })
  @Post(':id/photo')
  @UseGuards(RequireProviderGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/services',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    return this.serviceService.uploadPhoto(id, userId, file.filename);
  }

  @ApiOperation({ summary: 'Atualizar dados de um serviço (somente prestador dono)' })
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

  @ApiOperation({ summary: 'Remover um serviço (somente prestador dono)' })
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
