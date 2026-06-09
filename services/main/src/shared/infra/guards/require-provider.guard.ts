import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { UserDto } from '@users/application/dto/user.dto';

@Injectable()
export class RequireProviderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: UserDto }>();
    if (!request.user?.pixKey) {
      throw new ForbiddenException(
        'Esta ação requer perfil de prestador. Configure sua chave Pix e taxa horária.',
      );
    }
    return true;
  }
}
