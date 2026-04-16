import { UserService } from "@usuarios/application/services/user.service";
import { USER_REPOSITORY } from "@usuarios/domain/repositories/user-repository.interface";
import { UsersController } from "@usuarios/infra/controllers/users.controller";
import { FirebaseAuthService } from "@usuarios/infra/firebase/firebase-auth.service";
import { DrizzleUserRepository } from "@usuarios/infra/repositories/drizzle-user.repository";
import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [
    UserService,
    FirebaseAuthService,
    DrizzleUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: DrizzleUserRepository,
    },
  ],
  exports: [UserService, FirebaseAuthService],
})
export class UsuariosModule { }
