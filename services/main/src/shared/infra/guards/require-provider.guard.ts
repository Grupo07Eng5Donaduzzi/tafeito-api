import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import type { UserDto } from '@users/application/dto/user.dto';

@Injectable()
export class RequireProviderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: UserDto }>();
    const user = request.user;

    if (!user?.hourlyRate) {
      throw new ForbiddenException('Only providers can access this resource');
    }

    return true;
  }
}
