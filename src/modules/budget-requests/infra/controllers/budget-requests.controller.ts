import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { BudgetRequestService } from '../../application/services/budget-request.service';
import { CreateBudgetRequestDto } from '../../application/dto/create-budget-request.dto';

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

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.service.accept(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
