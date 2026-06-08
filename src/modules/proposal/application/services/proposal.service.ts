import { existsSync } from 'fs';
import { join } from 'path';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ConversationResponseDto } from '@chat/application/dto/conversation.dto';
import { ConversationService } from '@chat/application/services/conversation.service';
import { UserService } from '@users/application/services/user.service';
import { PaymentsService } from '../../../payments/application/services/payments.service';
import { BudgetRequestService } from '../../../budget-requests/application/services/budget-request.service';
import { ScheduleService } from '../../../schedules/application/services/schedule.service';
import { Proposal, ProposalStatus } from '../../domain/models/proposal.entity';
import type { ProposalRepository } from '../../domain/repositories/proposal-repository.interface';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal-repository.interface';
import {
  ContestProposalDto,
  CreateProposalDto,
  ProposalDto,
  RejectProposalDto,
  AcceptProposalResponseDto,
  PaymentCheckResponseDto,
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
    @Inject(forwardRef(() => ScheduleService))
    private readonly scheduleService: ScheduleService,
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
        'Cannot resubmit a proposal for this request',
      );
    }
    if (
      existingProposal &&
      existingProposal.status !== ProposalStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Provider already submitted a proposal for this request',
      );
    }

    const budgetRequest = await this.budgetRequestService.findById(dto.requestId);
    if (!budgetRequest) {
      throw new NotFoundException('Budget request not found');
    }
    if (budgetRequest.userId === providerId) {
      throw new ForbiddenException(
        'The requester cannot create a proposal for their own request',
      );
    }

    const provider = await this.userService.findById(providerId);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (!provider.hourlyRate || provider.hourlyRate <= 0) {
      throw new BadRequestException(
        'Provider must set a positive hourly rate before sending proposals',
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
      throw new NotFoundException('Proposal not found');
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
  ): Promise<AcceptProposalResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureClient(proposal, clientId);

    if (
      proposal.status !== ProposalStatus.PENDING &&
      proposal.status !== ProposalStatus.NEGOTIATING
    ) {
      throw new BadRequestException(
        `Cannot accept a proposal with status: ${proposal.status}`,
      );
    }

    const client = await this.userService.findById(clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    if (!client.identification) {
      throw new BadRequestException(
        'Client must have a CPF or CNPJ registered to pay',
      );
    }

    const paymentData = await this.paymentsService.createPix({
      amount: proposal.amount,
      payerEmail: client.email,
      payerDocumentType: client.identification.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
      payerDocumentNumber: client.identification,
    });

    proposal.accept(paymentData.id);

    const conversation = await this.ensureProposalConversation(proposal);
    proposal.linkChat(conversation.id!);

    await this.proposalRepository.update(proposal);

    const updated = await this.proposalRepository.findById(proposalId);
    const response = new AcceptProposalResponseDto();
    response.proposal = ProposalDto.from(updated)!;
    response.paymentId = paymentData.id;
    response.qrCode = paymentData.qrCode;
    response.qrCodeBase64 = paymentData.qrCodeBase64;
    response.ticketUrl = paymentData.ticketUrl;
    return response;
  }

  async checkPaymentStatus(
    proposalId: string,
    clientId: string,
  ): Promise<PaymentCheckResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureClient(proposal, clientId);

    if (proposal.status === ProposalStatus.ACCEPTED) {
      const response = new PaymentCheckResponseDto();
      response.paid = true;
      response.status = 'CONFIRMED';
      response.proposal = ProposalDto.from(proposal)!;
      return response;
    }

    if (proposal.status !== ProposalStatus.AWAITING_PAYMENT) {
      throw new BadRequestException(
        `Cannot check payment for a proposal with status: ${proposal.status}`,
      );
    }

    if (!proposal.paymentId) {
      throw new BadRequestException('No payment associated with this proposal');
    }

    const paymentStatus = await this.paymentsService.getStatus(proposal.paymentId);

    if (paymentStatus.paid) {
      proposal.confirmPayment();
      await this.proposalRepository.update(proposal);

      const budgetRequest = await this.budgetRequestService.findById(proposal.requestId);
      if (budgetRequest) {
        try {
          await this.scheduleService.create({
            proposalId: proposal.id!,
            budgetRequestId: budgetRequest.id,
          });
        } catch (err) {
          this.logger.warn(
            `Failed to auto-create schedule for proposal ${proposalId}: ${(err as Error).message}`,
          );
        }
      }
    }

    const updated = await this.proposalRepository.findById(proposalId);
    const response = new PaymentCheckResponseDto();
    response.paid = paymentStatus.paid;
    response.status = paymentStatus.status;
    response.proposal = ProposalDto.from(updated)!;
    return response;
  }

  async providerConfirmCompletion(
    proposalId: string,
    providerId: string,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can confirm completion');
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
      throw new NotFoundException('Proposal not found');
    }
    this.ensureClient(proposal, clientId);

    const provider = await this.userService.findById(proposal.providerId);
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    if (!provider.pixKey) {
      throw new BadRequestException(
        'Provider must register a Pix key to receive payment',
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
        `Payment transfer failed for proposal ${proposalId}. Status already marked as COMPLETED. Manual intervention required.`,
        err,
      );
      throw err;
    }

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async uploadInvoice(
    proposalId: string,
    providerId: string,
    filename: string,
  ): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can upload the invoice');
    }

    proposal.attachInvoice(filename);
    await this.proposalRepository.update(proposal);

    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async getInvoiceFile(
    proposalId: string,
    userId: string,
  ): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    this.ensureParticipant(proposal, userId);

    if (!proposal.invoiceFile) {
      throw new NotFoundException('No invoice found for this proposal');
    }

    const filePath = join(process.cwd(), 'uploads', 'invoices', proposal.invoiceFile);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Invoice file not found on server');
    }

    const ext = proposal.invoiceFile.split('.').pop()?.toLowerCase();
    const mimeType =
      ext === 'pdf' ? 'application/pdf' :
      ext === 'xml' ? 'application/xml' :
      'application/octet-stream';

    return { filePath, filename: proposal.invoiceFile, mimeType };
  }

  async getClientServiceHistory(clientId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByClientId(clientId);
    return proposals
      .filter((p) => p.status === ProposalStatus.COMPLETED)
      .map((p) => ProposalDto.from(p)!);
  }

  async getProviderServiceHistory(providerId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByProviderId(providerId);
    return proposals
      .filter((p) => p.status === ProposalStatus.COMPLETED)
      .map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByRequest(requestId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByRequestId(requestId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByProvider(providerId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByProviderId(providerId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByClient(clientId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByClientId(clientId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposal(proposalId: string, userId?: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
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
      throw new NotFoundException('Proposal not found');
    }
    this.ensureParticipant(proposal, userId);

    const conversation = proposal.linkedChatId
      ? await this.conversationService.getConversationById(proposal.linkedChatId)
      : await this.conversationService.getConversationByProposalId(proposalId);

    if (!conversation) {
      throw new NotFoundException('Proposal conversation not found');
    }

    return conversation;
  }

  private async ensureProposalConversation(
    proposal: Proposal,
  ): Promise<ConversationResponseDto> {
    if (proposal.linkedChatId) {
      return this.conversationService.getConversationById(proposal.linkedChatId);
    }

    const budgetRequest = await this.budgetRequestService.findById(proposal.requestId);
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
