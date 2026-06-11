export enum PaymentExchangeName {
  CREATED = 'tafeito.payment.created.exchange',
  CONFIRMED = 'tafeito.payment.confirmed.exchange',
}

export enum PaymentRoutingKey {
  CREATED = 'payment.created',
  CONFIRMED = 'payment.confirmed',
}

export interface PaymentCreatedPayload {
  proposalId: string;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  status: string;
  ticketUrl?: string;
}

export interface PaymentConfirmedPayload {
  proposalId: string;
  paymentId: string;
}
