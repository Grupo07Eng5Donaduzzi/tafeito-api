import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infra/guards/jwt-auth.guard';
import { UserService } from '@users/application/services/user.service';

type HttpRequest = {
  headers: { authorization?: string };
  method?: string;
  path?: string;
  url?: string;
  user?: unknown;
};

@Injectable()
export class AuthGuard extends JwtAuthGuard {
  constructor(private readonly userService: UserService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = await super.canActivate(context);
    if (!allowed) return false;

    const request = context.switchToHttp().getRequest<HttpRequest>();
    if (!request.user) return true;

    const userId = (request.user as { id: string }).id;
    const user = await this.userService.findById(userId);

    if (!user) {
      const path = request.path ?? request.url ?? '';
      if (path.includes('/admin/') || path.includes('/admin')) return true;
      throw new UnauthorizedException('User not found');
    }

    request.user = user;
    return true;
  }

  protected isPublicPath(request: HttpRequest): boolean {
    const path = request.path ?? request.url ?? '';

    if (path.startsWith('/docs') || path.startsWith('/uploads')) return true;

    if (request.method === 'POST') {
      if (
        path.endsWith('/auth/login') ||
        path.endsWith('/auth/register') ||
        path.endsWith('/auth/forgot-password') ||
        path.endsWith('/admin/auth/login')
      ) {
        return true;
      }
      if (path.includes('/payments/webhook')) return true;
    }

    return false;
  }
}
