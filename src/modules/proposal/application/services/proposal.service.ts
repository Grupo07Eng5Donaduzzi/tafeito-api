import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConversationResponseDto } from '@chat/application/dto/conversation.dto';
import { ConversationService } from '@chat/application/services/conversation.service';
import { UserService } from '@users/application/services/user.service';
import { PaymentsService } from '../../../payments/application/services/payments.service';
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
  private readonly logger = new Logger(ProposalService.name);

  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
    private readonly budgetRequestService: BudgetRequestService,
    private readonly conversationService: ConversationService,
    private readonly userService: UserService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createProposal(
    providerId: string,
    dto: CreateProposalDto,
  ): Promise<ProposalDto> {
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
        'Não é possível reenviar proposta para esta solicitação',
      );
    }
    if (
      existingProposal &&
      existingProposal.status !== ProposalStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Prestador já enviou uma proposta para esta solicitação',
      );
    }

    const budgetRequest = await this.budgetRequestService.findById(
      dto.requestId,
    );
    if (!budgetRequest) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (budgetRequest.userId === providerId) {
      throw new ForbiddenException(
        'O solicitante não pode criar uma proposta para seu próprio pedido',
      );
    }

    const provider = await this.userService.findById(providerId);
    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }
    if (!provider.hourlyRate || provider.hourlyRate <= 0) {
      throw new BadRequestException(
        'Prestador deve definir uma taxa horária positiva antes de enviar propostas',
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

    return ProposalDto.from(created)!;
  }

  async contestProposal(
    proposalId: string,
    clientId: string,
    dto: ContestProposalDto,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    this.ensureClient(proposal, clientId);

    proposal.contest(dto.reason);
    const conversation = await this.ensureProposalConversation(proposal);
    proposal.linkChat(conversation.id!);
    await this.proposalRepository.update(proposal);

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
      throw new NotFoundException('Proposta não encontrada');
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
      throw new NotFoundException('Proposta não encontrada');
    }
    this.ensureClient(proposal, clientId);

    if (
      proposal.status !== ProposalStatus.PENDING &&
      proposal.status !== ProposalStatus.NEGOTIATING
    ) {
      throw new BadRequestException(
        `Não é possível aceitar proposta no status: ${proposal.status}`,
      );
    }

    proposal.accept();

    const conversation = await this.ensureProposalConversation(proposal);
    proposal.linkChat(conversation.id!);

    await this.proposalRepository.update(proposal);

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async providerConfirmCompletion(
    proposalId: string,
    providerId: string,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException(
        'Apenas o prestador pode confirmar a conclusão',
      );
    }
    proposal.providerConfirm();
    await this.proposalRepository.update(proposal);
    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async clientConfirmCompletion(
    proposalId: string,
    clientId: string,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    this.ensureClient(proposal, clientId);

    const provider = await this.userService.findById(proposal.providerId);
    if (!provider) {
      throw new NotFoundException('Prestador não encontrado');
    }
    if (!provider.pixKey) {
      throw new BadRequestException(
        'Prestador precisa cadastrar uma chave Pix para receber o pagamento',
      );
    }

    proposal.clientConfirm();
    await this.proposalRepository.update(proposal);

    try {
      await this.paymentsService.transferToPix(
        proposal.amount,
        provider.pixKey,
        proposal.id,
      );
    } catch (err) {
      this.logger.error(
        `Falha na transferência para proposta ${proposalId}. Status já marcado como COMPLETED. Intervenção manual necessária.`,
        err,
      );
      throw err;
    }

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async getProposalsByRequest(requestId: string): Promise<ProposalDto[]> {
    const proposals =
      await this.proposalRepository.findByRequestId(requestId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByProvider(providerId: string): Promise<ProposalDto[]> {
    const proposals =
      await this.proposalRepository.findByProviderId(providerId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByClient(clientId: string): Promise<ProposalDto[]> {
    const proposals =
      await this.proposalRepository.findByClientId(clientId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposal(
    proposalId: string,
    userId?: string,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    if (userId) {
      this.ensureParticipant(proposal, userId);
    }
    return ProposalDto.from(proposal)!;
  }

  async getProposalChat(
    proposalId: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    this.ensureParticipant(proposal, userId);

    const conversation = proposal.linkedChatId
      ? await this.conversationService.getConversationById(
          proposal.linkedChatId,
        )
      : await this.conversationService.getConversationByProposalId(proposalId);

    if (!conversation) {
      throw new NotFoundException('Conversa da proposta não encontrada');
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
      throw new NotFoundException('Solicitação não encontrada');
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
        'Apenas o cliente da solicitação pode realizar esta ação',
      );
    }
  }

  private ensureParticipant(proposal: Proposal, userId: string): void {
    if (proposal.clientId !== userId && proposal.providerId !== userId) {
      throw new ForbiddenException(
        'Apenas os participantes da proposta podem acessar este recurso',
      );
    }
  }
}
