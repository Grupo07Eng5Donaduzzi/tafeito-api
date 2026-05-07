import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
// import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { NegotiationMessage, SenderRole, ProposalStatus } from '../../domain/models/proposal.entity';
import type {
  ProposalRepository,
  NegotiationMessageRepository,
} from '../../domain/repositories/proposal-repository.interface';
import {
  PROPOSAL_REPOSITORY,
  NEGOTIATION_MESSAGE_REPOSITORY,
} from '../../domain/repositories/proposal-repository.interface';
import { CreateNegotiationMessageDto, NegotiationMessageDto, SendRevisedProposalDto } from '../dto/proposal.dto';

@Injectable()
export class NegotiationService {
  constructor(
    @Inject(PROPOSAL_REPOSITORY) private readonly proposalRepository: ProposalRepository,
    @Inject(NEGOTIATION_MESSAGE_REPOSITORY) private readonly messageRepository: NegotiationMessageRepository,
    // private readonly amqpConnection: AmqpConnection
  ) {}

  async sendMessage(proposalId: string, userId: string, senderRole: SenderRole, dto: CreateNegotiationMessageDto): Promise<NegotiationMessageDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposal is not in negotiation status');
    }

    const message = NegotiationMessage.create({
      proposalId,
      senderRole,
      senderUserId: userId,
      message: dto.message,
      revisedAmount: dto.revisedAmount,
    });

    await this.messageRepository.create(message);
    const created = await this.messageRepository.findById(message.id!);

    return NegotiationMessageDto.from(created)!;
  }

  async sendRevisedProposal(proposalId: string, providerId: string, dto: SendRevisedProposalDto): Promise<NegotiationMessageDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can send revised proposal');
    }

    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposal is not in negotiation status');
    }

    // Update proposal amount
    proposal.updateAmount(dto.amount);
    await this.proposalRepository.update(proposal);

    // Create message with revised amount
    const message = NegotiationMessage.create({
      proposalId,
      senderRole: SenderRole.PROVIDER,
      senderUserId: providerId,
      message: dto.message,
      revisedAmount: dto.amount,
    });

    await this.messageRepository.create(message);
    const created = await this.messageRepository.findById(message.id!);

    return NegotiationMessageDto.from(created)!;
  }

  async closeNegotiation(proposalId: string, clientId: string): Promise<void> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposal is not in negotiation status');
    }

    proposal.closeNegotiation();
    await this.proposalRepository.update(proposal);

    // await this.amqpConnection.publish(
    //   'tafeito.events',
    //   'negotiation.closed',
    //   {
    //     proposalId,
    //     requestId: proposal.requestId,
    //     providerId: proposal.providerId,
    //     status: ProposalStatus.CANCELLED,
    //     canResubmit: proposal.canResubmit,
    //     timestamp: new Date().toISOString(),
    //   }
    // );
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
