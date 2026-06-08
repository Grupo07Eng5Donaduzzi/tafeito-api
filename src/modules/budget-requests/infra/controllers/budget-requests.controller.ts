import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { CurrentUser } from '@shared/infra/current-user.decorator';
import { BudgetRequestService } from '../../application/services/budget-request.service';
import { CreateBudgetRequestDto } from '../../application/dto/create-budget-request.dto';
import { CancelBudgetRequestDto } from '../../application/dto/cancel-budget-request.dto';
import { BudgetRequestDto } from '../../application/dto/budget-request.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTOS = 5;
const UPLOADS_PATH = './uploads/photos';

@ApiTags('Budget Requests')
@ApiBearerAuth('access-token')
@Controller('budgetRequests')
export class BudgetRequestsController {
  constructor(private readonly service: BudgetRequestService) {}

  @ApiOperation({ summary: 'Create a new budget request' })
  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateBudgetRequestDto) {
    return this.service.create(userId, dto);
  }

  @ApiOperation({ summary: 'Get all budget requests for the authenticated user' })
  @Get('mine')
  findMine(@CurrentUser() userId: string) {
    return this.service.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Get available budget requests for a service' })
  @Get('available')
  findAvailable(@Query('service_id') serviceId: string) {
    return this.service.findAvailableByServiceId(serviceId);
  }

  @ApiOperation({ summary: 'Get a budget request by ID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @ApiOperation({ summary: 'Upload up to 5 photos for a budget request' })
  @ApiConsumes('multipart/form-data')
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', MAX_PHOTOS, {
      storage: diskStorage({
        destination: UPLOADS_PATH,
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG and WebP images are allowed'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async addPhotos(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BudgetRequestDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }
    return this.service.addPhotos(id, userId, files.map((f) => f.filename));
  }

  @ApiOperation({ summary: 'Cancel a budget request' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: CancelBudgetRequestDto,
  ): Promise<void> {
    await this.service.cancel(id, userId, dto);
  }

  @ApiOperation({ summary: 'Delete a budget request' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() userId: string): Promise<void> {
    await this.service.delete(id, userId);
  }
}
