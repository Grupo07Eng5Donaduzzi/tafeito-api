import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
// import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Proposal, ProposalStatus, NegotiationMessage, SenderRole } from '../../domain/models/proposal.entity';
import type {
  ProposalRepository,
  NegotiationMessageRepository,
} from '../../domain/repositories/proposal-repository.interface';
import {
  PROPOSAL_REPOSITORY,
  NEGOTIATION_MESSAGE_REPOSITORY,
} from '../../domain/repositories/proposal-repository.interface';
import { CreateProposalDto, ProposalDto, RejectProposalDto } from '../dto/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(
    @Inject(PROPOSAL_REPOSITORY) private readonly proposalRepository: ProposalRepository,
    // private readonly amqpConnection: AmqpConnection
  ) {}

  async createProposal(providerId: string, dto: CreateProposalDto): Promise<ProposalDto> {
    // Check if provider can resubmit for this request
    const existingProposal = await this.proposalRepository.findByRequestAndProvider(dto.requestId, providerId);
    if (existingProposal && existingProposal.status === ProposalStatus.CANCELLED && !existingProposal.canResubmit) {
      throw new BadRequestException('Cannot resubmit proposal for this request');
    }

    const proposal = Proposal.create({
      requestId: dto.requestId,
      providerId,
      amount: dto.amount,
    });

    await this.proposalRepository.create(proposal);
    const created = await this.proposalRepository.findByRequestAndProvider(dto.requestId, providerId);

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

  async rejectProposal(proposalId: string, clientId: string, dto: RejectProposalDto): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    proposal.reject(dto.reason);
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

  async acceptProposal(proposalId: string, clientId: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status === ProposalStatus.PENDING) {
      proposal.accept();
    } else if (proposal.status === ProposalStatus.NEGOTIATING) {
      proposal.accept();
    } else {
      throw new BadRequestException(`Cannot accept proposal in status: ${proposal.status}`);
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
    const proposals = await this.proposalRepository.findByProviderId(providerId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposal(proposalId: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return ProposalDto.from(proposal)!;
  }
}
