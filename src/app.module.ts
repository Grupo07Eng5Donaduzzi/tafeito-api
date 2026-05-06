import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
// import { UsuariosModule } from './modules/usuarios/usuarios.module';
// import { ServicosModule } from './modules/servicos/servicos.module';
// import { PedidosModule } from './modules/pedidos/pedidos.module';
import { ContestacaoModule } from './modules/contestacao/contestacao.module';

@Module({
  imports: [SharedModule, /* UsuariosModule, ServicosModule, PedidosModule, */ ContestacaoModule],
})
export class AppModule {}
