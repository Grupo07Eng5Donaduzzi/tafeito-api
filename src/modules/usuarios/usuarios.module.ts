import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UserService } from './application/services/user.service';
import { FirebaseAuthService } from './infra/firebase/firebase-auth.service';
import { UsersController } from './infra/controllers/users.controller';
import { DrizzleUserRepository } from './infra/repositories/drizzle-user.repository';
import { USER_REPOSITORY } from './domain/repositories/user-repository.interface';

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
export class UsuariosModule {}