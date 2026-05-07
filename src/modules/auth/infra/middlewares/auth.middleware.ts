import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@users/application/services/user.service';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../../domain/models/auth-jwt-payload.model';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ?? '',
      ) as AuthJwtPayload;

      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      (req as any).user = user;
      next();
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
