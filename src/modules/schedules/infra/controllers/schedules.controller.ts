import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ScheduleService } from '../../application/services/schedule.service';
import { CreateScheduleDto } from '../../application/dto/create-schedule.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: ScheduleService) {}

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('proposal/:proposalId')
  findByProposalId(@Param('proposalId') proposalId: string) {
    return this.service.findByProposalId(proposalId);
  }
}
