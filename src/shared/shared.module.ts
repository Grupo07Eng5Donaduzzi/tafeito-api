import { Module, Global } from "@nestjs/common";
import { DrizzleService } from "@shared/infra/database/drizzle.service";

@Global()
@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class SharedModule {}
