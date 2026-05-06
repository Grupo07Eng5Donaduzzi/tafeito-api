import { v4 as uuid } from 'uuid';

export enum ProposalStatus {
  PENDING = 'PENDING',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED',
}

export enum SenderRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
}

export class Proposal {
  private readonly _id?: string;
  private _proposalId?: string;
  private _requestId: string;
  private _providerId: string;
  private _amount: number;
  private _status: ProposalStatus;
  private _rejectionReason?: string;
  private _canResubmit: boolean;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get proposalId(): string | undefined {
    return this._proposalId;
  }

  get requestId(): string {
    return this._requestId;
  }

  get providerId(): string {
    return this._providerId;
  }

  get amount(): number {
    return this._amount;
  }

  get status(): ProposalStatus {
    return this._status;
  }

  get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  get canResubmit(): boolean {
    return this._canResubmit;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  static create(props: {
    requestId: string;
    providerId: string;
    amount: number;
  }): Proposal {
    const proposal = new Proposal();
    proposal._requestId = props.requestId;
    proposal._providerId = props.providerId;
    proposal._amount = props.amount;
    proposal._status = ProposalStatus.PENDING;
    proposal._canResubmit = true;
    return proposal;
  }

  static restore(props: {
    id: string;
    requestId: string;
    providerId: string;
    amount: number;
    status: ProposalStatus;
    rejectionReason?: string;
    canResubmit: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Proposal {
    const proposal = new Proposal(props.id, props.createdAt, props.updatedAt);
    proposal._requestId = props.requestId;
    proposal._providerId = props.providerId;
    proposal._amount = props.amount;
    proposal._status = props.status;
    proposal._rejectionReason = props.rejectionReason;
    proposal._canResubmit = props.canResubmit;
    return proposal;
  }

  reject(reason: string): void {
    if (this._status !== ProposalStatus.PENDING) {
      throw new Error('Cannot reject proposal that is not PENDING');
    }
    this._status = ProposalStatus.NEGOTIATING;
    this._rejectionReason = reason;
  }

  accept(): void {
    if (this._status !== ProposalStatus.NEGOTIATING && this._status !== ProposalStatus.PENDING) {
      throw new Error('Cannot accept proposal in current status');
    }
    this._status = ProposalStatus.ACCEPTED;
  }

  closeNegotiation(): void {
    if (this._status !== ProposalStatus.NEGOTIATING) {
      throw new Error('Cannot close negotiation for proposal that is not NEGOTIATING');
    }
    this._status = ProposalStatus.CANCELLED;
    this._canResubmit = false;
  }

  updateAmount(newAmount: number): void {
    if (this._status !== ProposalStatus.NEGOTIATING) {
      throw new Error('Cannot update amount for proposal that is not NEGOTIATING');
    }
    this._amount = newAmount;
  }
}

export class NegotiationMessage {
  private readonly _id?: string;
  private _proposalId: string;
  private _senderRole: SenderRole;
  private _senderUserId: string;
  private _message: string;
  private _revisedAmount?: number;
  private readonly _createdAt?: Date;

  private constructor(id?: string, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get proposalId(): string {
    return this._proposalId;
  }

  get senderRole(): SenderRole {
    return this._senderRole;
  }

  get senderUserId(): string {
    return this._senderUserId;
  }

  get message(): string {
    return this._message;
  }

  get revisedAmount(): number | undefined {
    return this._revisedAmount;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  static create(props: {
    proposalId: string;
    senderRole: SenderRole;
    senderUserId: string;
    message: string;
    revisedAmount?: number;
  }): NegotiationMessage {
    const msg = new NegotiationMessage();
    msg._proposalId = props.proposalId;
    msg._senderRole = props.senderRole;
    msg._senderUserId = props.senderUserId;
    msg._message = props.message;
    msg._revisedAmount = props.revisedAmount;
    return msg;
  }

  static restore(props: {
    id: string;
    proposalId: string;
    senderRole: SenderRole;
    senderUserId: string;
    message: string;
    revisedAmount?: number;
    createdAt: Date;
  }): NegotiationMessage {
    const msg = new NegotiationMessage(props.id, props.createdAt);
    msg._proposalId = props.proposalId;
    msg._senderRole = props.senderRole;
    msg._senderUserId = props.senderUserId;
    msg._message = props.message;
    msg._revisedAmount = props.revisedAmount;
    return msg;
  }
}
