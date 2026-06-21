import { existsSync } from 'fs';
import { join } from 'path';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../../../users/application/services/user.service';
import { BudgetRequestService } from '../../../budget-requests/application/services/budget-request.service';
import { ProposalMessagingService } from './proposal-messaging.service';
import { ChatHttpService } from './chat-http.service';
import { Proposal, ProposalStatus } from '../../domain/models/proposal.entity';
import type { ProposalRepository } from '../../domain/repositories/proposal-repository.interface';
import { PROPOSAL_REPOSITORY } from '../../domain/repositories/proposal-repository.interface';
import {
  ContestProposalDto,
  ContestResponseDto,
  CreateProposalDto,
  ProposalDto,
  RejectProposalDto,
  ReviseProposalDto,
  ReviseResponseDto,
  PaymentCheckResponseDto,
} from '../dto/proposal.dto';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(
    @Inject(PROPOSAL_REPOSITORY)
    private readonly proposalRepository: ProposalRepository,
    private readonly budgetRequestService: BudgetRequestService,
    private readonly userService: UserService,
    private readonly proposalMessagingService: ProposalMessagingService,
    private readonly chatHttpService: ChatHttpService,
  ) {}

  async createProposal(providerId: string, dto: CreateProposalDto): Promise<ProposalDto> {
    const existingProposal = await this.proposalRepository.findByRequestAndProvider(
      dto.requestId,
      providerId,
    );
    if (existingProposal && existingProposal.status === ProposalStatus.CANCELLED && !existingProposal.canResubmit) {
      throw new BadRequestException('Cannot resubmit a proposal for this request');
    }
    if (existingProposal && existingProposal.status !== ProposalStatus.CANCELLED) {
      throw new BadRequestException('Provider already submitted a proposal for this request');
    }
    const budgetRequest = await this.budgetRequestService.findById(dto.requestId);
    if (!budgetRequest) throw new NotFoundException('Budget request not found');
    if (budgetRequest.userId === providerId) {
      throw new ForbiddenException('The requester cannot create a proposal for their own request');
    }

    const proposal = Proposal.create({
      requestId: dto.requestId,
      clientId: budgetRequest.userId,
      providerId,
      amount: dto.amount,
    });
    await this.proposalRepository.create(proposal);
    const created = await this.proposalRepository.findByRequestAndProvider(dto.requestId, providerId);
    return ProposalDto.from(created)!;
  }

  async contestProposal(
    proposalId: string,
    clientId: string,
    dto: ContestProposalDto,
  ): Promise<ContestResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.ensureClient(proposal, clientId);
    this.tryEntityOp(() => proposal.contest(dto.reason));
    await this.proposalRepository.update(proposal);

    const budgetRequest = await this.budgetRequestService.findById(proposal.requestId);
    const serviceTitle = budgetRequest?.title ?? 'serviço';
    const formattedAmount = proposal.amount.toFixed(2).replace('.', ',');
    const autoMessage = `Quero negociar a proposta para "${serviceTitle}" no valor de R$ ${formattedAmount}.`;

    let conversationId: string;
    let isNew = false;
    try {
      const result = await this.chatHttpService.ensureConversation(clientId, proposal.providerId);
      conversationId = result.conversationId;
      isNew = result.isNew;
      await this.chatHttpService.sendMessage(conversationId, clientId, proposal.providerId, autoMessage);
    } catch (err) {
      this.logger.warn(`Failed to create chat for proposal ${proposalId}: ${(err as Error).message}`);
      conversationId = '';
    }

    const updated = await this.proposalRepository.findById(proposalId);
    const response = new ContestResponseDto();
    response.proposal = ProposalDto.from(updated)!;
    response.conversationId = conversationId;
    response.isNew = isNew;
    return response;
  }

  async reviseProposal(
    proposalId: string,
    providerId: string,
    dto: ReviseProposalDto,
  ): Promise<ReviseResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can revise a proposal');
    }
    this.tryEntityOp(() => proposal.revise(dto.amount));
    await this.proposalRepository.update(proposal);

    let conversationId: string = '';
    try {
      const result = await this.chatHttpService.ensureConversation(providerId, proposal.clientId);
      conversationId = result.conversationId;
      await this.chatHttpService.sendMessage(
        conversationId,
        providerId,
        proposal.clientId,
        'Revisei a proposta! Confira seus orçamentos para ver o novo valor.',
      );
    } catch (err) {
      this.logger.warn(`Failed to send revision message for proposal ${proposalId}: ${(err as Error).message}`);
    }

    const updated = await this.proposalRepository.findById(proposalId);
    const response = new ReviseResponseDto();
    response.proposal = ProposalDto.from(updated)!;
    response.conversationId = conversationId;
    return response;
  }

  async getNegotiatingProposals(providerId: string, clientId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findNegotiatingBetween(clientId, providerId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async rejectProposal(proposalId: string, clientId: string, dto: RejectProposalDto): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.ensureClient(proposal, clientId);
    this.tryEntityOp(() => proposal.definitivelyReject(dto.reason));
    await this.proposalRepository.update(proposal);
    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async acceptProposal(proposalId: string, clientId: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.ensureClient(proposal, clientId);
    if (proposal.status !== ProposalStatus.PENDING && proposal.status !== ProposalStatus.NEGOTIATING) {
      throw new BadRequestException(`Cannot accept a proposal with status: ${proposal.status}`);
    }
    const client = await this.userService.findById(clientId);
    if (!client) throw new NotFoundException('Client not found');
    if (!client.identification) {
      throw new BadRequestException('Client must have a CPF or CNPJ registered to pay');
    }
    this.tryEntityOp(() => proposal.accept());
    await this.proposalRepository.update(proposal);
    try {
      await this.proposalMessagingService.publishProposalAccepted({
        proposalId,
        amount: proposal.amount,
        clientId,
        providerId: proposal.providerId,
        clientEmail: client.email,
        clientDocumentType: client.identification.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ',
        clientDocumentNumber: client.identification,
      });
    } catch (err) {
      this.logger.error(`Failed to publish proposal.accepted for ${proposalId}: ${(err as Error).message}`);
      throw new InternalServerErrorException('Falha ao iniciar o processo de pagamento. Tente novamente.');
    }
    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async checkPaymentStatus(proposalId: string, clientId: string): Promise<PaymentCheckResponseDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.ensureClient(proposal, clientId);
    const response = new PaymentCheckResponseDto();
    response.paid = proposal.status === ProposalStatus.ACCEPTED;
    response.status = proposal.status;
    response.proposal = ProposalDto.from(proposal)!;
    response.paymentId = proposal.paymentId;
    response.qrCode = proposal.qrCode;
    response.qrCodeBase64 = proposal.qrCodeBase64;
    response.ticketUrl = proposal.ticketUrl;
    return response;
  }

  async providerConfirmCompletion(proposalId: string, providerId: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can confirm completion');
    }
    this.tryEntityOp(() => proposal.providerConfirm());
    await this.proposalRepository.update(proposal);
    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async clientConfirmCompletion(proposalId: string, clientId: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.ensureClient(proposal, clientId);
    const provider = await this.userService.findById(proposal.providerId);
    if (!provider) throw new NotFoundException('Provider not found');
    if (!provider.pixKey) {
      throw new BadRequestException('Provider must register a Pix key to receive payment');
    }
    this.tryEntityOp(() => proposal.clientConfirm());
    await this.proposalRepository.update(proposal);
    try {
      await this.proposalMessagingService.publishProposalClientConfirmed({
        proposalId,
        amount: proposal.amount,
        providerId: proposal.providerId,
        providerPixKey: provider.pixKey,
      });
    } catch (err) {
      this.logger.error(`Failed to publish proposal.clientConfirmed for ${proposalId}: ${(err as Error).message}`);
      throw new InternalServerErrorException('Falha ao iniciar a transferência. Tente novamente.');
    }
    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async uploadInvoice(proposalId: string, providerId: string, filename: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.providerId !== providerId) {
      throw new ForbiddenException('Only the provider can upload the invoice');
    }
    this.tryEntityOp(() => proposal.attachInvoice(filename));
    await this.proposalRepository.update(proposal);
    const updated = await this.proposalRepository.findById(proposalId);
    return ProposalDto.from(updated)!;
  }

  async getInvoiceFile(proposalId: string, userId: string): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    this.ensureParticipant(proposal, userId);
    if (!proposal.invoiceFile) throw new NotFoundException('No invoice found for this proposal');
    const filePath = join(process.cwd(), 'uploads', 'invoices', proposal.invoiceFile);
    if (!existsSync(filePath)) throw new NotFoundException('Invoice file not found on server');
    const ext = proposal.invoiceFile.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'xml' ? 'application/xml' : 'application/octet-stream';
    return { filePath, filename: proposal.invoiceFile, mimeType };
  }

  async getClientServiceHistory(clientId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByClientId(clientId);
    return proposals.filter((p) => p.status === ProposalStatus.COMPLETED).map((p) => ProposalDto.from(p)!);
  }

  async findCompletedByServiceAndClient(
    serviceId: string,
    clientId: string,
  ): Promise<ProposalDto | null> {
    const proposal = await this.proposalRepository.findCompletedByServiceAndClient(serviceId, clientId);
    return proposal ? ProposalDto.from(proposal) : null;
  }

  async getProviderServiceHistory(providerId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByProviderId(providerId);
    return proposals.filter((p) => p.status === ProposalStatus.COMPLETED).map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByRequest(requestId: string): Promise<ProposalDto[]> {
    const proposals = await this.proposalRepository.findByRequestId(requestId);
    return proposals.map((p) => ProposalDto.from(p)!);
  }

  async getProposalsByProvider(providerId: string): Promise<ProposalDto[]> {
    const rows = await this.proposalRepository.findByProviderIdWithDetails(providerId);
    return rows.map(ProposalDto.fromRaw);
  }

  async getProposalsByClient(clientId: string): Promise<ProposalDto[]> {
    const rows = await this.proposalRepository.findByClientIdWithDetails(clientId);
    return rows.map(ProposalDto.fromRaw);
  }

  async getProposal(proposalId: string, userId?: string): Promise<ProposalDto> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (userId) this.ensureParticipant(proposal, userId);
    return ProposalDto.from(proposal)!;
  }

  private ensureClient(proposal: Proposal, clientId: string): void {
    if (proposal.clientId !== clientId) {
      throw new ForbiddenException('Only the request client can perform this action');
    }
  }

  private ensureParticipant(proposal: Proposal, userId: string): void {
    if (proposal.clientId !== userId && proposal.providerId !== userId) {
      throw new ForbiddenException('Only proposal participants can access this resource');
    }
  }

  private tryEntityOp(fn: () => void): void {
    try {
      fn();
    } catch (err) {
      if (
        err instanceof Error &&
        !(err instanceof BadRequestException) &&
        !(err instanceof ForbiddenException) &&
        !(err instanceof NotFoundException)
      ) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }
}
