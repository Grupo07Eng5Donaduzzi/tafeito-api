import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { RequireProviderGuard } from '@shared/infra/guards/require-provider.guard';
import { ConversationResponseDto } from '@chat/application/dto/conversation.dto';
import { ProposalService } from '../../application/services/proposal.service';
import { NegotiationService } from '../../application/services/negotiation.service';
import {
  ContestProposalDto,
  CreateProposalDto,
  RejectProposalDto,
  CreateNegotiationMessageDto,
  SendRevisedProposalDto,
  ProposalDto,
  NegotiationMessageDto,
  AcceptProposalResponseDto,
  PaymentCheckResponseDto,
} from '../../application/dto/proposal.dto';

@ApiTags('Proposals')
@ApiBearerAuth('access-token')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @ApiOperation({ summary: 'Create a new proposal (provider only)' })
  @Post()
  @UseGuards(RequireProviderGuard)
  async create(
    @CurrentUser() providerId: string,
    @Body() body: CreateProposalDto,
  ): Promise<ProposalDto> {
    return this.proposalService.createProposal(providerId, body);
  }

  @ApiOperation({ summary: 'Get all proposals created by the authenticated provider' })
  @Get('provider/created')
  async findProviderCreated(
    @CurrentUser() providerId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProposalsByProvider(providerId);
  }

  @ApiOperation({ summary: 'Get all proposals received by the authenticated client' })
  @Get('client/requested')
  async findClientRequested(
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProposalsByClient(clientId);
  }

  @ApiOperation({ summary: 'Get a proposal by ID' })
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.getProposal(id, userId);
  }

  @ApiOperation({ summary: 'Contest a proposal and start negotiation' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/contest')
  async contest(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: ContestProposalDto,
  ): Promise<void> {
    await this.proposalService.contestProposal(proposalId, clientId, body);
  }

  @ApiOperation({ summary: 'Definitively reject a proposal' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/reject')
  async reject(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: RejectProposalDto,
  ): Promise<void> {
    await this.proposalService.rejectProposal(proposalId, clientId, body);
  }

  @ApiOperation({ summary: 'Accept a proposal — returns a PIX QR code for payment' })
  @Post(':id/accept')
  async accept(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<AcceptProposalResponseDto> {
    return this.proposalService.acceptProposal(proposalId, clientId);
  }

  @ApiOperation({ summary: 'Poll payment status — activates the proposal and creates a schedule when paid' })
  @Get(':id/payment')
  async checkPayment(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<PaymentCheckResponseDto> {
    return this.proposalService.checkPaymentStatus(proposalId, clientId);
  }

  @ApiOperation({ summary: 'Provider confirms service completion' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/providerConfirm')
  @UseGuards(RequireProviderGuard)
  async providerConfirm(
    @Param('id') proposalId: string,
    @CurrentUser() providerId: string,
  ): Promise<void> {
    await this.proposalService.providerConfirmCompletion(proposalId, providerId);
  }

  @ApiOperation({ summary: 'Client confirms service completion — triggers payment transfer to provider' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/clientConfirm')
  async clientConfirm(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<void> {
    await this.proposalService.clientConfirmCompletion(proposalId, clientId);
  }

  @ApiOperation({ summary: 'Get the linked chat conversation for a proposal' })
  @Get(':id/chat')
  async getChat(
    @Param('id') proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<ConversationResponseDto> {
    return this.proposalService.getProposalChat(proposalId, userId);
  }
}

@ApiTags('Negotiations')
@ApiBearerAuth('access-token')
@Controller('negotiations')
export class NegotiationsController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @ApiOperation({ summary: 'Send a negotiation message' })
  @Post(':proposalId/messages')
  async sendMessage(
    @Param('proposalId') proposalId: string,
    @CurrentUser() userId: string,
    @Body() body: CreateNegotiationMessageDto,
  ): Promise<NegotiationMessageDto> {
    return this.negotiationService.sendMessage(proposalId, userId, body);
  }

  @ApiOperation({ summary: 'Send a revised proposal (provider only)' })
  @Post(':proposalId/revisedProposal')
  @UseGuards(RequireProviderGuard)
  async sendRevisedProposal(
    @Param('proposalId') proposalId: string,
    @CurrentUser() providerId: string,
    @Body() body: SendRevisedProposalDto,
  ): Promise<NegotiationMessageDto> {
    return this.negotiationService.sendRevisedProposal(proposalId, providerId, body);
  }

  @ApiOperation({ summary: 'Close a negotiation' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':proposalId/close')
  async closeNegotiation(
    @Param('proposalId') proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.negotiationService.closeNegotiation(proposalId, userId);
  }

  @ApiOperation({ summary: 'Get all negotiation messages for a proposal' })
  @Get(':proposalId/messages')
  async getMessages(
    @Param('proposalId') proposalId: string,
  ): Promise<NegotiationMessageDto[]> {
    return this.negotiationService.getMessages(proposalId);
  }
}
