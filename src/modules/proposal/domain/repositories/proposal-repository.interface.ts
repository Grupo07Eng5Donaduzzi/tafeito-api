import type { Proposal, NegotiationMessage } from '../models/proposal.entity';

export const PROPOSAL_REPOSITORY = Symbol('PROPOSAL_REPOSITORY');
export const NEGOTIATION_MESSAGE_REPOSITORY = Symbol(
  'NEGOTIATION_MESSAGE_REPOSITORY',
);

export interface ProposalRepository {
  create(proposal: Proposal): Promise<void>;
  update(proposal: Proposal): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Proposal[]>;
  findById(id: string): Promise<Proposal | null>;
  findByRequestId(requestId: string): Promise<Proposal[]>;
  findByClientId(
    clientId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }>;
  findByProviderId(
    providerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }>;
  findByRequestAndProvider(
    requestId: string,
    providerId: string,
  ): Promise<Proposal | null>;
}

export interface NegotiationMessageRepository {
  create(message: NegotiationMessage): Promise<void>;
  findByProposalId(
    proposalId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: NegotiationMessage[]; total: number }>;
  findById(id: string): Promise<NegotiationMessage | null>;
}
