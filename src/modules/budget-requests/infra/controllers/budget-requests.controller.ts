import { BadRequestException, Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';

import { BudgetRequestService } from '../../application/services/budget-request.service';
import { CreateBudgetRequestDto } from '../../application/dto/create-budget-request.dto';
import { CancelBudgetRequestDto } from '../../application/dto/cancel-budget-request.dto';

@Controller('budget-requests')
export class BudgetRequestsController {
  constructor(private readonly service: BudgetRequestService) {}

  @Post()
  create(@Body() dto: CreateBudgetRequestDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get('available')
  findAvailableByServiceId(@Query('serviceId') serviceId?: string) {
    if (!serviceId || serviceId.trim().length === 0) {
      throw new BadRequestException('serviceId is required');
    }

    return this.service.findAvailableByServiceId(serviceId);
  }


  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelBudgetRequestDto) {
    return this.service.cancel(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
