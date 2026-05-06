import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProposalService } from '../../application/services/proposal.service';
import { NegotiationService } from '../../application/services/negotiation.service';
import {
  CreateProposalDto,
  RejectProposalDto,
  CreateNegotiationMessageDto,
  SendRevisedProposalDto,
  ProposalDto,
  NegotiationMessageDto,
} from '../../application/dto/proposal.dto';

@Controller('proposals')
export class ProposalsController {
  constructor(
    private readonly proposalService: ProposalService,
    private readonly negotiationService: NegotiationService
  ) {}

  @Post()
  async create(
    @Body() body: CreateProposalDto & { providerId?: string }
  ): Promise<ProposalDto> {
    const providerId = body.providerId || 'default-provider-id';
    return this.proposalService.createProposal(providerId, body);
  }

  @Get()
  async findAll(
    @Query('requestId') requestId?: string,
    @Query('providerId') providerId?: string
  ): Promise<ProposalDto[]> {
    if (requestId) {
      return this.proposalService.getProposalsByRequest(requestId);
    }
    if (providerId) {
      return this.proposalService.getProposalsByProvider(providerId);
    }
    return [];
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProposalDto> {
    return this.proposalService.getProposal(id);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') proposalId: string,
    @Body() body: RejectProposalDto & { clientId?: string }
  ): Promise<ProposalDto> {
    const clientId = body.clientId || 'default-client-id';
    return this.proposalService.rejectProposal(proposalId, clientId, body);
  }

  @Patch(':id/accept')
  async accept(
    @Param('id') proposalId: string,
    @Body() body: { clientId?: string }
  ): Promise<ProposalDto> {
    const clientId = body.clientId || 'default-client-id';
    return this.proposalService.acceptProposal(proposalId, clientId);
  }
}

@Controller('negotiations')
export class NegotiationsController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Post(':proposalId/messages')
  async sendMessage(
    @Param('proposalId') proposalId: string,
    @Body() body: CreateNegotiationMessageDto & { userId?: string; senderRole?: string }
  ): Promise<NegotiationMessageDto> {
    const userId = body.userId || 'default-user-id';
    const senderRole = (body.senderRole as any) || 'CLIENT';
    return this.negotiationService.sendMessage(proposalId, userId, senderRole, body);
  }

  @Post(':proposalId/revised-proposal')
  async sendRevisedProposal(
    @Param('proposalId') proposalId: string,
    @Body() body: SendRevisedProposalDto & { providerId?: string }
  ): Promise<NegotiationMessageDto> {
    const providerId = body.providerId || 'default-provider-id';
    return this.negotiationService.sendRevisedProposal(proposalId, providerId, body);
  }

  @Patch(':proposalId/close')
  async closeNegotiation(
    @Param('proposalId') proposalId: string,
    @Body() body: { clientId?: string }
  ): Promise<void> {
    const clientId = body.clientId || 'default-client-id';
    return this.negotiationService.closeNegotiation(proposalId, clientId);
  }

  @Get(':proposalId/messages')
  async getMessages(@Param('proposalId') proposalId: string): Promise<NegotiationMessageDto[]> {
    return this.negotiationService.getMessages(proposalId);
  }
}
