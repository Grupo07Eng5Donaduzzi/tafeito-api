import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '@shared/application/dto/pagination-query.dto';
import { CurrentUser } from '@shared/infra/current-user.decorator';
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

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  async create(
    @CurrentUser() providerId: string,
    @Body() body: CreateProposalDto,
  ): Promise<ProposalDto> {
    return this.proposalService.createProposal(providerId, body);
  }

  @Get()
  async findAll(
    @Query('requestId') requestId?: string,
    @Query('providerId') providerId?: string,
    @Query() query?: PaginationQueryDto,
  ) {
    if (requestId) {
      return this.proposalService.getProposalsByRequest(requestId);
    }
    if (providerId) {
      return this.proposalService.getProposalsByProvider(
        providerId,
        query?.page ?? 1,
        query?.pageSize ?? 20,
      );
    }
    return [];
  }

  @Get('provider/created')
  async findProviderCreated(
    @CurrentUser() providerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.proposalService.getProposalsByProvider(
      providerId,
      query.page,
      query.pageSize,
    );
  }

  @Get('client/requested')
  async findClientRequested(
    @CurrentUser() clientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.proposalService.getProposalsByClient(
      clientId,
      query.page,
      query.pageSize,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProposalDto> {
    return this.proposalService.getProposal(id);
  }

  @Post(':id/contest')
  async contest(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: ContestProposalDto,
  ): Promise<ProposalDto> {
    return this.proposalService.contestProposal(proposalId, clientId, body);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: RejectProposalDto,
  ): Promise<ProposalDto> {
    return this.proposalService.rejectProposal(proposalId, clientId, body);
  }

  @Patch(':id/accept')
  async accept(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.acceptProposal(proposalId, clientId);
  }

  @Patch(':id/provider-confirm')
  async providerConfirm(
    @Param('id') proposalId: string,
    @CurrentUser() providerId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.providerConfirmCompletion(proposalId, providerId);
  }

  @Patch(':id/client-confirm')
  async clientConfirm(
    @Param('id') proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.clientConfirmCompletion(proposalId, clientId);
  }

  @Get(':id/chat')
  async getChat(
    @Param('id') proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<ConversationResponseDto> {
    return this.proposalService.getProposalChat(proposalId, userId);
  }
}

@Controller('negotiations')
export class NegotiationsController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Post(':proposalId/messages')
  async sendMessage(
    @Param('proposalId') proposalId: string,
    @Body()
    body: CreateNegotiationMessageDto & {
      userId?: string;
      senderRole?: string;
    },
  ): Promise<NegotiationMessageDto> {
    const userId = body.userId || 'default-user-id';
    const senderRole = (body.senderRole as any) || 'CLIENT';
    return this.negotiationService.sendMessage(
      proposalId,
      userId,
      senderRole,
      body,
    );
  }

  @Post(':proposalId/revised-proposal')
  async sendRevisedProposal(
    @Param('proposalId') proposalId: string,
    @Body() body: SendRevisedProposalDto & { providerId?: string },
  ): Promise<NegotiationMessageDto> {
    const providerId = body.providerId || 'default-provider-id';
    return this.negotiationService.sendRevisedProposal(
      proposalId,
      providerId,
      body,
    );
  }

  @Patch(':proposalId/close')
  async closeNegotiation(
    @Param('proposalId') proposalId: string,
    @Body() body: { clientId?: string },
  ): Promise<void> {
    const clientId = body.clientId || 'default-client-id';
    return this.negotiationService.closeNegotiation(proposalId, clientId);
  }

  @Get(':proposalId/messages')
  async getMessages(
    @Param('proposalId') proposalId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.negotiationService.getMessages(
      proposalId,
      query.page,
      query.pageSize,
    );
  }
}
