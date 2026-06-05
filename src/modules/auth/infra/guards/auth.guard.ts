import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@users/application/services/user.service';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../../domain/models/auth-jwt-payload.model';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (this.isPublicRoute(request)) {
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    const token = authHeader.substring(7);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET não configurado');
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as AuthJwtPayload;

      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      (request as { user?: unknown }).user = user;
      return true;
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new UnauthorizedException('Token inválido');
    }
  }

  private isPublicRoute(request: Request): boolean {
    const path = request.path ?? request.url ?? '';

    if (path.startsWith('/api')) {
      return true;
    }

    if (request.method === 'POST') {
      if (path.endsWith('/auth/login') || path.endsWith('/auth/register')) {
        return true;
      }
      if (path.includes('/payments/webhook')) {
        return true;
      }
    }

    return false;
  }
}
