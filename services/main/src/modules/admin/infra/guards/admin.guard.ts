import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { eq } from 'drizzle-orm';
import { User } from '@users/domain/models/user.entity';
import { adminsSchema } from '../schemas/admin.schema';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly drizzleService: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: User;
      admin?: (typeof adminsSchema.$inferSelect);
    }>();

    const user = request.user;
    if (!user?.firebaseUid) {
      throw new ForbiddenException('Acesso negado');
    }

    const [admin] = await this.drizzleService.db
      .select()
      .from(adminsSchema)
      .where(eq(adminsSchema.firebaseUuid, user.firebaseUid))
      .limit(1);

    if (!admin) {
      throw new ForbiddenException('Acesso negado');
    }

    request.admin = admin;
    return true;
  }
}
