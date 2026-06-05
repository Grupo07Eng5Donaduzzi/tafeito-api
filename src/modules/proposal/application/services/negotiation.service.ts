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
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposta não está em negociação');
    }

    let senderRole: SenderRole;
    if (userId === proposal.clientId) {
      senderRole = SenderRole.CLIENT;
    } else if (userId === proposal.providerId) {
      senderRole = SenderRole.PROVIDER;
    } else {
      throw new ForbiddenException(
        'Apenas participantes da proposta podem enviar mensagens',
      );
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
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.providerId !== providerId) {
      throw new ForbiddenException(
        'Apenas o prestador pode enviar proposta revisada',
      );
    }

    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposta não está em negociação');
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
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.clientId !== userId) {
      throw new ForbiddenException(
        'Apenas o cliente pode encerrar a negociação',
      );
    }

    if (proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException('Proposta não está em negociação');
    }

    proposal.closeNegotiation();
    await this.proposalRepository.update(proposal);
  }

  async getMessages(proposalId: string): Promise<NegotiationMessageDto[]> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    const messages =
      await this.messageRepository.findByProposalId(proposalId);
    return messages.map((m) => NegotiationMessageDto.from(m)!);
  }
}
