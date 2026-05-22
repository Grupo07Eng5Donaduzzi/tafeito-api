import { Module, Global } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { FirebaseStorageService } from '@shared/infra/storage/firebase-storage.service';

@Global()
@Module({
  providers: [DrizzleService, FirebaseStorageService],
  exports: [DrizzleService, FirebaseStorageService],
})
export class SharedModule {}
