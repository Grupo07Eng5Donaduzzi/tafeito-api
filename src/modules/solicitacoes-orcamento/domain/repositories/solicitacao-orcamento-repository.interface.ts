import { SolicitacaoOrcamento } from '../models/solicitacao-orcamento.entity';

export const SOLICITACAO_ORCAMENTO_REPOSITORY = Symbol('SolicitacaoOrcamentoRepository');

export interface SolicitacaoOrcamentoRepository {
  create(solicitacao: SolicitacaoOrcamento): Promise<void>;
  update(solicitacao: SolicitacaoOrcamento): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<SolicitacaoOrcamento | null>;
  findByUsuarioId(usuarioId: string): Promise<SolicitacaoOrcamento[]>;
  findAll(): Promise<SolicitacaoOrcamento[]>;
}

