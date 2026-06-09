import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HateoasItem } from '@shared/infra/hateoas';
import { ScheduleService } from '../../application/services/schedule.service';
import { CreateScheduleDto } from '../../application/dto/create-schedule.dto';
import { ScheduleDto } from '../../application/dto/schedule.dto';

@ApiTags('Schedules')
@ApiBearerAuth('access-token')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: ScheduleService) {}

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @HateoasItem<ScheduleDto>({
    basePath: '/schedules',
    itemLinks: (item) => ({
      self: { href: `/schedules/${item.id}`, method: 'GET' },
      proposal: { href: `/proposals/${item.proposalId}`, method: 'GET' },
      budgetRequest: { href: `/budgetRequests/${item.budgetRequestId}`, method: 'GET' },
    }),
  })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('proposal/:proposalId')
  @HateoasItem<ScheduleDto>({
    basePath: '/schedules',
    itemLinks: (item) => ({
      self: { href: `/schedules/${item.id}`, method: 'GET' },
      proposal: { href: `/proposals/${item.proposalId}`, method: 'GET' },
      budgetRequest: { href: `/budgetRequests/${item.budgetRequestId}`, method: 'GET' },
    }),
  })
  findByProposalId(@Param('proposalId') proposalId: string) {
    return this.service.findByProposalId(proposalId);
  }
}
