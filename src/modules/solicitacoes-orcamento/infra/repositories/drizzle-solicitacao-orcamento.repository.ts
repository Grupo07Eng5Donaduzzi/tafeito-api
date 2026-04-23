import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { SolicitacaoOrcamentoRepository } from '../../domain/repositories/solicitacao-orcamento-repository.interface';
import { SolicitacaoOrcamento } from '../../domain/models/solicitacao-orcamento.entity';
import { solicitacoesOrcamentoSchema } from '../schemas/solicitacao-orcamento.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class DrizzleSolicitacaoOrcamentoRepository implements SolicitacaoOrcamentoRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(solicitacao: SolicitacaoOrcamento): Promise<void> {
    await this.drizzleService.db.insert(solicitacoesOrcamentoSchema).values({
      usuarioId: solicitacao.usuarioId,
      servicoId: solicitacao.servicoId,
      descricao: solicitacao.descricao,
      dataSolicitacao: solicitacao.dataSolicitacao,
      status: solicitacao.status,
      fotos: solicitacao.fotos,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(solicitacao: SolicitacaoOrcamento): Promise<void> {
    await this.drizzleService.db
      .update(solicitacoesOrcamentoSchema)
      .set({
        usuarioId: solicitacao.usuarioId,
        servicoId: solicitacao.servicoId,
        descricao: solicitacao.descricao,
        dataSolicitacao: solicitacao.dataSolicitacao,
        status: solicitacao.status,
        fotos: solicitacao.fotos,
        updatedAt: new Date(),
      })
      .where(eq(solicitacoesOrcamentoSchema.id, solicitacao.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(solicitacoesOrcamentoSchema)
      .where(eq(solicitacoesOrcamentoSchema.id, id));
  }

  async findById(id: string): Promise<SolicitacaoOrcamento | null> {
    const result = await this.drizzleService.db
      .select()
      .from(solicitacoesOrcamentoSchema)
      .where(eq(solicitacoesOrcamentoSchema.id, id))
      .limit(1);
    return SolicitacaoOrcamento.restore(result[0]);
  }

  async findByUsuarioId(usuarioId: string): Promise<SolicitacaoOrcamento[]> {
    const rows = await this.drizzleService.db
      .select()
      .from(solicitacoesOrcamentoSchema)
      .where(eq(solicitacoesOrcamentoSchema.usuarioId, usuarioId));
    return rows.map((row) => SolicitacaoOrcamento.restore(row)!);
  }

  async findAll(): Promise<SolicitacaoOrcamento[]> {
    const rows = await this.drizzleService.db
      .select()
      .from(solicitacoesOrcamentoSchema);
    return rows.map((row) => SolicitacaoOrcamento.restore(row)!);
  }
}

