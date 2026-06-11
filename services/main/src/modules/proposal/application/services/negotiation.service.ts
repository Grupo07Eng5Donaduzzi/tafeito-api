import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import {
  NegotiationMessage,
  SenderRole,
  ProposalStatus,
} from '../../domain/models/proposal.entity';
import type {
  ProposalRepository,
  NegotiationMessageRepository,
} from '../../domain/repositories/proposal-repository.interface';
import {
  PROPOSAL_REPOSITORY,
  NEGOTIATION_MESSAGE_REPOSITORY,
} from '../../domain/repositories/proposal-repository.interface';
import {
  CreateNegotiationMessageDto,
  NegotiationMessageDto,
  SendRevisedProposalDto,
} from '../dto/proposal.dto';

@Injectable()
export class NegotiationService {
  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
    @Inject(NEGOTIATION_MESSAGE_REPOSITORY)
    private readonly messageRepository: NegotiationMessageRepository,
  ) {}

  async sendMessage(
    proposalId: string,
    userId: string,
    dto: CreateNegotiationMessageDto,
  ): Promise<NegotiationMessageDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposal is not under negotiation');
    }

    let senderRole: SenderRole;
    if (userId === proposal.clientId) {
      senderRole = SenderRole.CLIENT;
    } else if (userId === proposal.providerId) {
      senderRole = SenderRole.PROVIDER;
    } else {
      throw new ForbiddenException('Only proposal participants can send messages');
    }

    const message = NegotiationMessage.create({
      proposalId,
      senderRole,
      senderUserId: userId,
      message: dto.message,
      revisedAmount: dto.revisedAmount,
    });

    const created = await this.messageRepository.create(message);
    return NegotiationMessageDto.from(created)!;
  }

  async sendRevisedProposal(
    proposalId: string,
    providerId: string,
    dto: SendRevisedProposalDto,
  ): Promise<NegotiationMessageDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can send a revised proposal');
    }
    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposal is not under negotiation');
    }

    proposal.updateEstimate(dto.estimatedHours);
    await this.proposalRepository.update(proposal);

    const message = NegotiationMessage.create({
      proposalId,
      senderRole: SenderRole.PROVIDER,
      senderUserId: providerId,
      message: dto.message,
      revisedAmount: proposal.amount,
    });

    const created = await this.messageRepository.create(message);
    return NegotiationMessageDto.from(created)!;
  }

  async closeNegotiation(proposalId: string, userId: string): Promise<void> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.clientId !== userId) {
      throw new ForbiddenException('Only the client can close the negotiation');
    }
    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposal is not under negotiation');
    }

    proposal.closeNegotiation();
    await this.proposalRepository.update(proposal);
  }

  async getMessages(proposalId: string): Promise<NegotiationMessageDto[]> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const messages = await this.messageRepository.findByProposalId(proposalId);
    return messages.map((m) => NegotiationMessageDto.from(m)!);
  }
}
