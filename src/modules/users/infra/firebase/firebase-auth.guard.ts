import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthService } from '@users/infra/firebase/firebase-auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAuthService: FirebaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.substring(7);

    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}