import type { Proposal } from '../models/proposal.entity';

export const PROPOSAL_REPOSITORY = Symbol('PROPOSAL_REPOSITORY');

export interface ProposalRepository {
  create(proposal: Proposal): Promise<void>;
  update(proposal: Proposal): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Proposal[]>;
  findById(id: string): Promise<Proposal | null>;
  findByRequestId(requestId: string): Promise<Proposal[]>;
  findByClientId(clientId: string): Promise<Proposal[]>;
  findByProviderId(providerId: string): Promise<Proposal[]>;
  findByProviderIdWithDetails(providerId: string): Promise<any[]>;
  findByClientIdWithDetails(clientId: string): Promise<any[]>;
  findByRequestAndProvider(requestId: string, providerId: string): Promise<Proposal | null>;
  findCompletedByServiceAndClient(serviceId: string, clientId: string): Promise<Proposal | null>;
  findNegotiatingBetween(clientId: string, providerId: string): Promise<Proposal[]>;
}
