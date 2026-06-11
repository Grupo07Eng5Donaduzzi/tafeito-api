import { UserService } from '@users/application/services/user.service';
import { USER_REPOSITORY } from '@users/domain/repositories/user-repository.interface';
import { UsersController } from '@users/infra/controllers/users.controller';
import { FirebaseAuthService } from '@users/infra/firebase/firebase-auth.service';
import { DrizzleUserRepository } from '@users/infra/repositories/drizzle-user.repository';
import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';

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
export class UsersModule {}
