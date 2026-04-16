import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";
import { UsuariosModule } from "@usuarios/usuarios.module";
import { ServicosModule } from "@servicos/servicos.module";
import { PedidosModule } from "@pedidos/pedidos.module";

@Module({
  imports: [
    SharedModule, 
    UsuariosModule,
    ServicosModule,
    PedidosModule
  ]
})
export class AppModule {}
