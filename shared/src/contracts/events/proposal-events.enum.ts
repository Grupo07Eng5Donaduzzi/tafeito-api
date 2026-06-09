export enum ProposalExchangeName {
  ACCEPTED = 'tafeito.proposal.accepted.exchange',
  CONTESTED = 'tafeito.proposal.contested.exchange',
  CLIENT_CONFIRMED = 'tafeito.proposal.client-confirmed.exchange',
}

export enum ProposalRoutingKey {
  ACCEPTED = 'proposal.accepted',
  CONTESTED = 'proposal.contested',
  CLIENT_CONFIRMED = 'proposal.client-confirmed',
}

export interface ProposalAcceptedPayload {
  proposalId: string;
  amount: number;
  clientId: string;
  providerId: string;
  clientEmail: string;
  clientDocumentType: 'CPF' | 'CNPJ';
  clientDocumentNumber: string;
}

export interface ProposalContestedPayload {
  proposalId: string;
  clientId: string;
  providerId: string;
  serviceId: string;
}

export interface ProposalClientConfirmedPayload {
  proposalId: string;
  amount: number;
  providerId: string;
  providerPixKey: string;
}
