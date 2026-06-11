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
  findByClientId(clientId: string): Promise<Proposal[]>;
  findByProviderId(providerId: string): Promise<Proposal[]>;
  findByRequestAndProvider(
    requestId: string,
    providerId: string,
  ): Promise<Proposal | null>;
  findCompletedByServiceAndClient(
    serviceId: string,
    clientId: string,
  ): Promise<Proposal | null>;
}

export interface NegotiationMessageRepository {
  create(message: NegotiationMessage): Promise<NegotiationMessage>;
  findByProposalId(proposalId: string): Promise<NegotiationMessage[]>;
  findById(id: string): Promise<NegotiationMessage | null>;
}
