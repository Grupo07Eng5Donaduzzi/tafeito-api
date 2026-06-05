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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
} from '../../application/dto/proposal.dto';

@ApiTags('Proposals')
@ApiBearerAuth('access-token')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @UseGuards(RequireProviderGuard)
  async create(
    @CurrentUser() providerId: string,
    @Body() body: CreateProposalDto,
  ): Promise<ProposalDto> {
    return this.proposalService.createProposal(providerId, body);
  }

  @Get('provider/created')
  async findProviderCreated(
    @CurrentUser() providerId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProposalsByProvider(providerId);
  }

  @Get('client/requested')
  async findClientRequested(
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProposalsByClient(clientId);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() userId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.getProposal(id, userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/contest')
  async contest(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: ContestProposalDto,
  ): Promise<void> {
    await this.proposalService.contestProposal(proposalId, clientId, body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/reject')
  async reject(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: RejectProposalDto,
  ): Promise<void> {
    await this.proposalService.rejectProposal(proposalId, clientId, body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/accept')
  async accept(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<void> {
    await this.proposalService.acceptProposal(proposalId, clientId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/providerConfirm')
  @UseGuards(RequireProviderGuard)
  async providerConfirm(
    @Param('id') proposalId: string,
    @CurrentUser() providerId: string,
  ): Promise<void> {
    await this.proposalService.providerConfirmCompletion(proposalId, providerId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/clientConfirm')
  async clientConfirm(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<void> {
    await this.proposalService.clientConfirmCompletion(proposalId, clientId);
  }

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

  @Post(':proposalId/messages')
  async sendMessage(
    @Param('proposalId') proposalId: string,
    @CurrentUser() userId: string,
    @Body() body: CreateNegotiationMessageDto,
  ): Promise<NegotiationMessageDto> {
    return this.negotiationService.sendMessage(proposalId, userId, body);
  }

  @Post(':proposalId/revisedProposal')
  @UseGuards(RequireProviderGuard)
  async sendRevisedProposal(
    @Param('proposalId') proposalId: string,
    @CurrentUser() providerId: string,
    @Body() body: SendRevisedProposalDto,
  ): Promise<NegotiationMessageDto> {
    return this.negotiationService.sendRevisedProposal(
      proposalId,
      providerId,
      body,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':proposalId/close')
  async closeNegotiation(
    @Param('proposalId') proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.negotiationService.closeNegotiation(proposalId, userId);
  }

  @Get(':proposalId/messages')
  async getMessages(
    @Param('proposalId') proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<NegotiationMessageDto[]> {
    return this.negotiationService.getMessages(proposalId);
  }
}
