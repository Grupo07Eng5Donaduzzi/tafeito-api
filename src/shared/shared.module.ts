import { Module, Global } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';

@Global()
@Module({
})
export class SharedModule {}
