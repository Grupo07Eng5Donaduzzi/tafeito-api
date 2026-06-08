import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUUID,
} from 'class-validator';
import {
  Proposal,
  ProposalStatus,
  NegotiationMessage,
  SenderRole,
} from '../../domain/models/proposal.entity';

export class CreateProposalDto {
  @IsUUID()
  requestId: string;

  @IsNumber()
  @Min(0.01)
  estimatedHours: number;
}

export class RejectProposalDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ContestProposalDto {
  @IsString()
  reason: string;
}

export class CreateNegotiationMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  revisedAmount?: number;
}

export class SendRevisedProposalDto {
  @IsNumber()
  @Min(0.01)
  estimatedHours: number;

  @IsString()
  message: string;
}

export class ProposalDto {
  id: string;
  requestId: string;
  clientId: string;
  providerId: string;
  estimatedHours: number;
  hourlyRate: number;
  amount: number;
  status: ProposalStatus;
  rejectionReason?: string;
  linkedChatId?: string;
  canResubmit: boolean;
  paymentId?: string;
  invoiceFile?: string;
  createdAt: Date;
  updatedAt: Date;

  static from(proposal: Proposal | null): ProposalDto | null {
    if (!proposal) return null;
    const dto = new ProposalDto();
    dto.id = proposal.id!;
    dto.requestId = proposal.requestId;
    dto.clientId = proposal.clientId;
    dto.providerId = proposal.providerId;
    dto.estimatedHours = proposal.estimatedHours;
    dto.hourlyRate = proposal.hourlyRate;
    dto.amount = proposal.amount;
    dto.status = proposal.status;
    dto.rejectionReason = proposal.rejectionReason;
    dto.linkedChatId = proposal.linkedChatId;
    dto.canResubmit = proposal.canResubmit;
    dto.paymentId = proposal.paymentId;
    dto.invoiceFile = proposal.invoiceFile;
    dto.createdAt = proposal.createdAt!;
    dto.updatedAt = proposal.updatedAt!;
    return dto;
  }
}

export class AcceptProposalResponseDto {
  proposal: ProposalDto;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
}

export class PaymentCheckResponseDto {
  paid: boolean;
  status: string;
  proposal: ProposalDto;
}

export class NegotiationMessageDto {
  id: string;
  proposalId: string;
  senderRole: SenderRole;
  senderUserId: string;
  message: string;
  revisedAmount?: number;
  createdAt: Date;

  static from(msg: NegotiationMessage | null): NegotiationMessageDto | null {
    if (!msg) return null;
    const dto = new NegotiationMessageDto();
    dto.id = msg.id!;
    dto.proposalId = msg.proposalId;
    dto.senderRole = msg.senderRole;
    dto.senderUserId = msg.senderUserId;
    dto.message = msg.message;
    dto.revisedAmount = msg.revisedAmount;
    dto.createdAt = msg.createdAt!;
    return dto;
  }
}
