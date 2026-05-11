import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { BudgetRequestService } from '../../application/services/budget-request.service';
import { CreateBudgetRequestDto } from '../../application/dto/create-budget-request.dto';
import { CancelBudgetRequestDto } from '../../application/dto/cancel-budget-request.dto';

@Controller('budget-requests')
export class BudgetRequestsController {
  constructor(private readonly service: BudgetRequestService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateBudgetRequestDto) {
    return this.service.create(userId, dto);
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

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelBudgetRequestDto) {
    return this.service.cancel(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
