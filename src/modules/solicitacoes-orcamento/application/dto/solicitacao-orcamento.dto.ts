import { SolicitacaoOrcamentoStatus } from '../../domain/models/solicitacao-orcamento.entity';

export class SolicitacaoOrcamentoDto {
  id!: string;
  usuarioId!: string;
  servicoId!: string;
  descricao!: string;
  dataSolicitacao!: Date;
  status!: SolicitacaoOrcamentoStatus;
  fotos?: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

