import { Inject, Injectable } from '@nestjs/common';
import type {
  SolicitacaoOrcamentoRepository,
} from '../../domain/repositories/solicitacao-orcamento-repository.interface';
import { SOLICITACAO_ORCAMENTO_REPOSITORY } from '../../domain/repositories/solicitacao-orcamento-repository.interface';
import { SolicitacaoOrcamento } from '../../domain/models/solicitacao-orcamento.entity';
import { CreateSolicitacaoOrcamentoDto } from '../dto/create-solicitacao-orcamento.dto';
import { SolicitacaoOrcamentoDto } from '../dto/solicitacao-orcamento.dto';

@Injectable()
export class SolicitacaoOrcamentoService {
  constructor(
    @Inject(SOLICITACAO_ORCAMENTO_REPOSITORY)
    private readonly repository: SolicitacaoOrcamentoRepository,
  ) {}

  async create(dto: CreateSolicitacaoOrcamentoDto): Promise<SolicitacaoOrcamentoDto> {
    const solicitacao = new SolicitacaoOrcamento({
      usuarioId: dto.usuarioId,
      servicoId: dto.servicoId,
      descricao: dto.descricao,
      dataSolicitacao: dto.dataSolicitacao,
      status: 'pendente',
      fotos: dto.fotos,
    });
    await this.repository.create(solicitacao);
    return this.toDto(solicitacao);
  }

  async findAll(): Promise<SolicitacaoOrcamentoDto[]> {
    const result = await this.repository.findAll();
    return result.map((s) => this.toDto(s));
  }

  async findById(id: string): Promise<SolicitacaoOrcamentoDto | null> {
    const result = await this.repository.findById(id);
    return result ? this.toDto(result) : null;
  }

  async findByUsuarioId(usuarioId: string): Promise<SolicitacaoOrcamentoDto[]> {
    const result = await this.repository.findByUsuarioId(usuarioId);
    return result.map((s) => this.toDto(s));
  }

  async cancelar(id: string): Promise<void> {
    const solicitacao = await this.repository.findById(id);
    if (!solicitacao) return;
    solicitacao.status = 'cancelada';
    solicitacao.updatedAt = new Date();
    await this.repository.update(solicitacao);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toDto(s: SolicitacaoOrcamento): SolicitacaoOrcamentoDto {
    return {
      id: s.id!,
      usuarioId: s.usuarioId,
      servicoId: s.servicoId,
      descricao: s.descricao,
      dataSolicitacao: s.dataSolicitacao,
      status: s.status,
      fotos: s.fotos,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}

