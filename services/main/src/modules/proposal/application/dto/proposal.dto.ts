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
  amount: number;
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
  amount: number;

  @IsString()
  message: string;
}

export class ProposalDto {
  id: string;
  requestId: string;
  clientId: string;
  providerId: string;
  amount: number;
  status: ProposalStatus;
  rejectionReason?: string;
  linkedChatId?: string;
  canResubmit: boolean;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  invoiceFile?: string;
  createdAt: Date;
  updatedAt: Date;
  budgetRequest?: {
    id: string;
    title: string;
    serviceId: string;
    service: { id: string; name: string } | null;
    client: { id: string; name: string } | null;
    provider: { id: string; name: string } | null;
  };

  static from(proposal: Proposal | null): ProposalDto | null {
    if (!proposal) return null;
    const dto = new ProposalDto();
    dto.id = proposal.id!;
    dto.requestId = proposal.requestId;
    dto.clientId = proposal.clientId;
    dto.providerId = proposal.providerId;
    dto.amount = proposal.amount;
    dto.status = proposal.status;
    dto.rejectionReason = proposal.rejectionReason;
    dto.linkedChatId = proposal.linkedChatId;
    dto.canResubmit = proposal.canResubmit;
    dto.paymentId = proposal.paymentId;
    dto.qrCode = proposal.qrCode;
    dto.qrCodeBase64 = proposal.qrCodeBase64;
    dto.ticketUrl = proposal.ticketUrl;
    dto.invoiceFile = proposal.invoiceFile;
    dto.createdAt = proposal.createdAt!;
    dto.updatedAt = proposal.updatedAt!;
    return dto;
  }

  static fromRaw(row: any): ProposalDto {
    const dto = new ProposalDto();
    dto.id = row.id;
    dto.requestId = row.requestId;
    dto.clientId = row.clientId;
    dto.providerId = row.providerId;
    dto.amount = parseFloat(row.amount);
    dto.status = row.status;
    dto.rejectionReason = row.rejectionReason ?? undefined;
    dto.linkedChatId = row.linkedChatId ?? undefined;
    dto.canResubmit = row.canResubmit;
    dto.paymentId = row.paymentId ?? undefined;
    dto.qrCode = row.qrCode ?? undefined;
    dto.qrCodeBase64 = row.qrCodeBase64 ?? undefined;
    dto.ticketUrl = row.ticketUrl ?? undefined;
    dto.invoiceFile = row.invoiceFile ?? undefined;
    dto.createdAt = row.createdAt;
    dto.updatedAt = row.updatedAt;
    dto.budgetRequest = {
      id: row.requestId,
      title: row.brTitle ?? '',
      serviceId: row.brServiceId ?? '',
      service: row.svcId ? { id: row.svcId, name: row.svcName } : null,
      client: row.clientUserId ? { id: row.clientUserId, name: row.clientUserName } : null,
      provider: row.providerUserId ? { id: row.providerUserId, name: row.providerUserName } : null,
    };
    return dto;
  }
}

export class PaymentCheckResponseDto {
  paid: boolean;
  status: string;
  proposal: ProposalDto;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
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
