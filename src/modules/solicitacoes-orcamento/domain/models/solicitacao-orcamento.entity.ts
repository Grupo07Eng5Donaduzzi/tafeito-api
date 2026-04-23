export type SolicitacaoOrcamentoStatus = 'pendente' | 'respondida' | 'cancelada';

export class SolicitacaoOrcamento {
  public id?: string;
  public usuarioId: string;
  public servicoId: string;
  public descricao: string;
  public dataSolicitacao: Date;
  public status: SolicitacaoOrcamentoStatus;
  public fotos?: string[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: Omit<SolicitacaoOrcamento, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: Date; updatedAt?: Date }) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.servicoId = props.servicoId;
    this.descricao = props.descricao;
    this.dataSolicitacao = props.dataSolicitacao;
    this.status = props.status;
    this.fotos = props.fotos;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static restore(row: any): SolicitacaoOrcamento | null {
    if (!row) return null;
    return new SolicitacaoOrcamento({
      id: row.id,
      usuarioId: row.usuarioId ?? row.usuario_id,
      servicoId: row.servicoId ?? row.servico_id,
      descricao: row.descricao,
      dataSolicitacao: row.dataSolicitacao ?? row.data_solicitacao,
      status: row.status,
      fotos: row.fotos,
      createdAt: row.createdAt ?? row.created_at,
      updatedAt: row.updatedAt ?? row.updated_at,
    });
  }
}

