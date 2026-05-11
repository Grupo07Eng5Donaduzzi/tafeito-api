import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
// import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConversationResponseDto } from '@chat/application/dto/conversation.dto';
import { ConversationService } from '@chat/application/services/conversation.service';
import { UserService } from '@users/application/services/user.service';
import { BudgetRequestService } from '../../../budget-requests/application/services/budget-request.service';
import { Proposal, ProposalStatus } from '../../domain/models/proposal.entity';
import type { ProposalRepository } from '../../domain/repositories/proposal-repository.interface';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal-repository.interface';
import {
  ContestProposalDto,
  CreateProposalDto,
  ProposalDto,
  RejectProposalDto,
} from '../dto/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
    private readonly budgetRequestService: BudgetRequestService,
    private readonly conversationService: ConversationService,
    private readonly userService: UserService,
    // private readonly amqpConnection: AmqpConnection
  ) {}

  async createProposal(
    providerId: string,
    dto: CreateProposalDto,
  ): Promise<ProposalDto> {
    // Check if provider can resubmit for this request
    const existingProposal =
      await this.proposalRepository.findByRequestAndProvider(
        dto.requestId,
        providerId,
      );
    if (
      existingProposal &&
      existingProposal.status === ProposalStatus.CANCELLED &&
      !existingProposal.canResubmit
    ) {
      throw new BadRequestException(
        'Cannot resubmit proposal for this request',
      );
    }
    if (
      existingProposal &&
      existingProposal.status !== ProposalStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Provider already sent a proposal for this request',
      );
    }

    const budgetRequest = await this.budgetRequestService.findById(
      dto.requestId,
    );
    if (!budgetRequest) {
      throw new NotFoundException('Budget request not found');
    }
    if (budgetRequest.userId === providerId) {
      throw new ForbiddenException(
        'Request owner cannot create a proposal for their own request',
      );
    }

    const provider = await this.userService.findById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (!provider.hourlyRate || provider.hourlyRate <= 0) {
      throw new BadRequestException(
        'Provider must define a positive hourlyRate before sending proposals',
      );
    }

    const proposal = Proposal.create({
      requestId: dto.requestId,
      clientId: budgetRequest.userId,
      providerId,
      estimatedHours: dto.estimatedHours,
      hourlyRate: provider.hourlyRate,
    });

    await this.proposalRepository.create(proposal);
    const created = await this.proposalRepository.findByRequestAndProvider(
      dto.requestId,
      providerId,
    );

    // await this.amqpConnection.publish(
    //   'tafeito.events',
    //   'proposal.created',
    //   {
    //     proposalId: created?.id,
    //     requestId: dto.requestId,
    //     providerId,
    //     amount: dto.amount,
    //     status: ProposalStatus.PENDING,
    //     timestamp: new Date().toISOString(),
    //   }
    // );

    return ProposalDto.from(created)!;
  }

  async contestProposal(
    proposalId: string,
    clientId: string,
    dto: ContestProposalDto,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureClient(proposal, clientId);

    proposal.contest(dto.reason);
    const conversation = await this.ensureProposalConversation(proposal);
    proposal.linkChat(conversation.id!);
    await this.proposalRepository.update(proposal);

    // await this.amqpConnection.publish(
    //   'tafeito.events',
    //   'proposal.rejected',
    //   {
    //     proposalId,
    //     requestId: proposal.requestId,
    //     providerId: proposal.providerId,
    //     reason: dto.reason,
    //     status: ProposalStatus.NEGOTIATING,
    //     timestamp: new Date().toISOString(),
    //   }
    // );

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async rejectProposal(
    proposalId: string,
    clientId: string,
    dto: RejectProposalDto,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureClient(proposal, clientId);

    proposal.definitivelyReject(dto.reason);
    await this.proposalRepository.update(proposal);

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async acceptProposal(
    proposalId: string,
    clientId: string,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureClient(proposal, clientId);

    if (proposal.status === ProposalStatus.PENDING) {
      proposal.accept();
    } else if (proposal.status === ProposalStatus.NEGOTIATING) {
      proposal.accept();
    } else {
      throw new BadRequestException(
        `Cannot accept proposal in status: ${proposal.status}`,
      );
    }

    await this.proposalRepository.update(proposal);

    // await this.amqpConnection.publish(
    //   'tafeito.events',
    //   'proposal.accepted',
    //   {
    //     proposalId,
    //     requestId: proposal.requestId,
    //     providerId: proposal.providerId,
    //     amount: proposal.amount,
    //     status: ProposalStatus.ACCEPTED,
    //     timestamp: new Date().toISOString(),
    //   }
    // );

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async getProposalsByRequest(requestId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByRequestId(requestId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByProvider(providerId: string): Promise<ProposalDto[]> {
    const proposals =
      await this.proposalRepository.findByProviderId(providerId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByClient(clientId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByClientId(clientId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposal(proposalId: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return ProposalDto.from(proposal)!;
  }

  async getProposalChat(
    proposalId: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureParticipant(proposal, userId);

    const conversation = proposal.linkedChatId
      ? await this.conversationService.getConversationById(
          proposal.linkedChatId,
        )
      : await this.conversationService.getConversationByProposalId(proposalId);

    if (!conversation) {
      throw new NotFoundException('Proposal chat not found');
    }

    return conversation;
  }

  private async ensureProposalConversation(
    proposal: Proposal,
  ): Promise<ConversationResponseDto> {
    if (proposal.linkedChatId) {
      return this.conversationService.getConversationById(
        proposal.linkedChatId,
      );
    }

    const budgetRequest = await this.budgetRequestService.findById(
      proposal.requestId,
    );
    if (!budgetRequest) {
      throw new NotFoundException('Budget request not found');
    }

    return this.conversationService.createConversation(
      budgetRequest.serviceId,
      proposal.clientId,
      [proposal.clientId, proposal.providerId],
      proposal.id,
    );
  }

  private ensureClient(proposal: Proposal, clientId: string): void {
    if (proposal.clientId !== clientId) {
      throw new ForbiddenException(
        'Only the request client can perform this action',
      );
    }
  }

  private ensureParticipant(proposal: Proposal, userId: string): void {
    if (proposal.clientId !== userId && proposal.providerId !== userId) {
      throw new ForbiddenException(
        'Only proposal participants can access this resource',
      );
    }
  }
}
