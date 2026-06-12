import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';

type HttpRequest = {
  headers: { authorization?: string };
  method?: string;
  path?: string;
  url?: string;
  user?: unknown;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<HttpRequest>();

    if (this.isPublicPath(request)) return true;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET não configurado');
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as { sub: string };
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  protected isPublicPath(_request: HttpRequest): boolean {
    return false;
  }
}
