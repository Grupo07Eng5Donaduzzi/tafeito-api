export const PAYMENT_RECORD_REPOSITORY = 'PAYMENT_RECORD_REPOSITORY';

export interface PaymentRecord {
  id?: string;
  proposalId: string;
  asaasPaymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  status: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentRecordRepository {
  create(record: PaymentRecord): Promise<void>;
  findByProposalId(proposalId: string): Promise<PaymentRecord | null>;
  findByAsaasPaymentId(asaasPaymentId: string): Promise<PaymentRecord | null>;
  updateStatus(id: string, status: string): Promise<void>;
}
