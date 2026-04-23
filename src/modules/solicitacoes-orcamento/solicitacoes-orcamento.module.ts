import { Module } from '@nestjs/common';
import { SolicitacoesOrcamentoController } from './infra/controllers/solicitacoes-orcamento.controller';
import { SolicitacaoOrcamentoService } from './application/services/solicitacao-orcamento.service';
import { DrizzleSolicitacaoOrcamentoRepository } from './infra/repositories/drizzle-solicitacao-orcamento.repository';
import { SOLICITACAO_ORCAMENTO_REPOSITORY } from './domain/repositories/solicitacao-orcamento-repository.interface';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SolicitacoesOrcamentoController],
  providers: [
    SolicitacaoOrcamentoService,
    DrizzleSolicitacaoOrcamentoRepository,
    {
      provide: SOLICITACAO_ORCAMENTO_REPOSITORY,
      useExisting: DrizzleSolicitacaoOrcamentoRepository,
    },
  ],
  exports: [SolicitacaoOrcamentoService],
})
export class SolicitacoesOrcamentoModule {}

