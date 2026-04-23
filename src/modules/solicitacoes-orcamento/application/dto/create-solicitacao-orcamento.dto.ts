export class CreateSolicitacaoOrcamentoDto {
  usuarioId!: string;
  servicoId!: string;
  descricao!: string;
  dataSolicitacao!: Date;
  fotos?: string[];
}

