import { v4 as uuid } from 'uuid';

export enum ProposalStatus {
  PENDING = 'PENDING',
  NEGOTIATING = 'NEGOTIATING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  ACCEPTED = 'ACCEPTED',
  PROVIDER_CONFIRMED = 'PROVIDER_CONFIRMED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum SenderRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
}

export class Proposal {
  private readonly _id?: string;
  private _requestId: string;
  private _clientId: string;
  private _providerId: string;
  private _amount: number;
  private _status: ProposalStatus;
  private _rejectionReason?: string;
  private _linkedChatId?: string;
  private _canResubmit: boolean;
  private _paymentId?: string;
  private _qrCode?: string;
  private _qrCodeBase64?: string;
  private _ticketUrl?: string;
  private _invoiceFile?: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get requestId(): string { return this._requestId; }
  get clientId(): string { return this._clientId; }
  get providerId(): string { return this._providerId; }
  get amount(): number { return this._amount; }
  get status(): ProposalStatus { return this._status; }
  get rejectionReason(): string | undefined { return this._rejectionReason; }
  get linkedChatId(): string | undefined { return this._linkedChatId; }
  get canResubmit(): boolean { return this._canResubmit; }
  get paymentId(): string | undefined { return this._paymentId; }
  get qrCode(): string | undefined { return this._qrCode; }
  get qrCodeBase64(): string | undefined { return this._qrCodeBase64; }
  get ticketUrl(): string | undefined { return this._ticketUrl; }
  get invoiceFile(): string | undefined { return this._invoiceFile; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  static create(props: {
    requestId: string;
    clientId: string;
    providerId: string;
    amount: number;
  }): Proposal {
    const proposal = new Proposal();
    proposal._requestId = props.requestId;
    proposal._clientId = props.clientId;
    proposal._providerId = props.providerId;
    proposal._amount = props.amount;
    proposal._status = ProposalStatus.PENDING;
    proposal._canResubmit = true;
    return proposal;
  }

  static restore(props: {
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
  }): Proposal {
    const proposal = new Proposal(props.id, props.createdAt, props.updatedAt);
    proposal._requestId = props.requestId;
    proposal._clientId = props.clientId;
    proposal._providerId = props.providerId;
    proposal._amount = props.amount;
    proposal._status = props.status;
    proposal._rejectionReason = props.rejectionReason;
    proposal._linkedChatId = props.linkedChatId;
    proposal._canResubmit = props.canResubmit;
    proposal._paymentId = props.paymentId;
    proposal._qrCode = props.qrCode;
    proposal._qrCodeBase64 = props.qrCodeBase64;
    proposal._ticketUrl = props.ticketUrl;
    proposal._invoiceFile = props.invoiceFile;
    return proposal;
  }

  contest(reason: string): void {
    if (this._status !== ProposalStatus.PENDING) {
      throw new Error('Cannot contest a proposal that is not PENDING');
    }
    this._status = ProposalStatus.NEGOTIATING;
    this._rejectionReason = reason;
  }

  definitivelyReject(reason?: string): void {
    if (this._status !== ProposalStatus.PENDING && this._status !== ProposalStatus.NEGOTIATING) {
      throw new Error('Cannot reject a proposal in its current status');
    }
    this._status = ProposalStatus.REJECTED;
    this._rejectionReason = reason;
    this._canResubmit = false;
  }

  accept(): void {
    if (this._status !== ProposalStatus.NEGOTIATING && this._status !== ProposalStatus.PENDING) {
      throw new Error('Cannot accept a proposal in its current status');
    }
    this._status = ProposalStatus.AWAITING_PAYMENT;
  }

  setPaymentData(paymentId: string, qrCode: string, qrCodeBase64: string, ticketUrl?: string): void {
    this._paymentId = paymentId;
    this._qrCode = qrCode;
    this._qrCodeBase64 = qrCodeBase64;
    this._ticketUrl = ticketUrl;
  }

  confirmPayment(): void {
    if (this._status !== ProposalStatus.AWAITING_PAYMENT) {
      throw new Error('Cannot confirm payment for a proposal not awaiting payment');
    }
    this._status = ProposalStatus.ACCEPTED;
  }

  closeNegotiation(): void {
    if (this._status !== ProposalStatus.NEGOTIATING) {
      throw new Error('Cannot close negotiation for a proposal that is not NEGOTIATING');
    }
    this._status = ProposalStatus.CANCELLED;
    this._canResubmit = false;
  }

  updateAmount(amount: number): void {
    if (this._status !== ProposalStatus.NEGOTIATING) {
      throw new Error('Cannot update amount for a proposal that is not NEGOTIATING');
    }
    this._amount = amount;
  }

  providerConfirm(): void {
    if (this._status !== ProposalStatus.ACCEPTED) {
      throw new Error('Cannot confirm completion for a proposal that is not ACCEPTED');
    }
    this._status = ProposalStatus.PROVIDER_CONFIRMED;
  }

  clientConfirm(): void {
    if (this._status !== ProposalStatus.PROVIDER_CONFIRMED) {
      throw new Error('Cannot confirm completion before the provider confirms');
    }
    this._status = ProposalStatus.COMPLETED;
  }

  linkChat(conversationId: string): void {
    this._linkedChatId = conversationId;
  }

  attachInvoice(filename: string): void {
    if (
      this._status !== ProposalStatus.ACCEPTED &&
      this._status !== ProposalStatus.PROVIDER_CONFIRMED &&
      this._status !== ProposalStatus.COMPLETED
    ) {
      throw new Error('Invoice can only be attached when the service is in progress or completed');
    }
    this._invoiceFile = filename;
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

  get id(): string | undefined { return this._id; }
  get proposalId(): string { return this._proposalId; }
  get senderRole(): SenderRole { return this._senderRole; }
  get senderUserId(): string { return this._senderUserId; }
  get message(): string { return this._message; }
  get revisedAmount(): number | undefined { return this._revisedAmount; }
  get createdAt(): Date | undefined { return this._createdAt; }

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
