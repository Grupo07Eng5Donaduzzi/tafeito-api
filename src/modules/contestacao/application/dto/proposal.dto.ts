import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsUUID } from 'class-validator';
import { Proposal, ProposalStatus, NegotiationMessage, SenderRole } from '../../domain/models/proposal.entity';

export class CreateProposalDto {
  @IsUUID()
  requestId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class RejectProposalDto {
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
  providerId: string;
  amount: number;
  status: ProposalStatus;
  rejectionReason?: string;
  canResubmit: boolean;
  createdAt: Date;
  updatedAt: Date;

  static from(proposal: Proposal | null): ProposalDto | null {
    if (!proposal) return null;
    const dto = new ProposalDto();
    dto.id = proposal.id!;
    dto.requestId = proposal.requestId;
    dto.providerId = proposal.providerId;
    dto.amount = proposal.amount;
    dto.status = proposal.status;
    dto.rejectionReason = proposal.rejectionReason;
    dto.canResubmit = proposal.canResubmit;
    dto.createdAt = proposal.createdAt!;
    dto.updatedAt = proposal.updatedAt!;
    return dto;
  }
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
