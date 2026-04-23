import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { SolicitacoesOrcamentoModule } from './modules/solicitacoes-orcamento/solicitacoes-orcamento.module';

@Module({
  imports: [SharedModule, UsersModule, AuthModule, ServicesModule, SolicitacoesOrcamentoModule],
})
export class AppModule {}
