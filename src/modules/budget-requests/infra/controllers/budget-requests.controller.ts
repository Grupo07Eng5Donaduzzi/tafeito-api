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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '@shared/infra/current-user.decorator';
import { BudgetRequestService } from '../../application/services/budget-request.service';
import { CreateBudgetRequestDto } from '../../application/dto/create-budget-request.dto';
import { CancelBudgetRequestDto } from '../../application/dto/cancel-budget-request.dto';

@ApiTags('Budget Requests')
@ApiBearerAuth('access-token')
@Controller('budgetRequests')
export class BudgetRequestsController {
  constructor(private readonly service: BudgetRequestService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateBudgetRequestDto) {
    return this.service.create(userId, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get('available')
  findAvailable(@Query('service_id') serviceId: string) {
    return this.service.findAvailableByServiceId(serviceId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: CancelBudgetRequestDto,
  ): Promise<void> {
    await this.service.cancel(id, userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() userId: string): Promise<void> {
    await this.service.delete(id, userId);
  }
}
