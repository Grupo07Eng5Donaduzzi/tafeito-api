import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseAuthService } from '@users/infra/firebase/firebase-auth.service';
import { UserService } from '@users/application/services/user.service';
import { UserDto } from '@users/application/dto/user.dto';
import type { StringValue } from 'ms';
import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../../domain/models/auth-jwt-payload.model';

interface JwtModule {
  sign: (payload: AuthJwtPayload, secret: string, options?: any) => string;
}

const jwtModule: JwtModule = jwt;

const EXPIRES_IN_RE = /^\d+(ms|s|m|h|d|w|y)?$/i;

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: StringValue | number;
  private readonly jwtIssuer?: string;
  private readonly jwtAudience?: string;

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly userService: UserService,
  ) {
    this.jwtSecret = process.env.JWT_SECRET ?? '';
    const rawExpiresIn = process.env.JWT_EXPIRES_IN ?? '1h';
    this.jwtIssuer = process.env.JWT_ISSUER;
    this.jwtAudience = process.env.JWT_AUDIENCE;

    if (!this.jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret não está configurado. Defina a variável de ambiente JWT_SECRET.',
      );
    }

    if (!EXPIRES_IN_RE.test(rawExpiresIn)) {
      throw new InternalServerErrorException(
        `JWT_EXPIRES_IN inválido: "${rawExpiresIn}". Use formato "1h", "30m", "7d" etc.`,
      );
    }
    this.jwtExpiresIn = rawExpiresIn as StringValue;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: UserDto }> {
    const firebaseUid =
      await this.firebaseAuthService.signInWithEmailAndPassword(
        email,
        password,
      );

    const user = await this.userService.findByFirebaseUid(firebaseUid);
    if (!user || !user.id) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou credenciais inválidas.',
      );
    }

    const payload: AuthJwtPayload = {
      sub: user.id,
      uid: user.firebaseUid,
      email: user.email,
    };

    const signOptions: any = {
      expiresIn: this.jwtExpiresIn,
    };
    if (this.jwtIssuer) signOptions.issuer = this.jwtIssuer;
    if (this.jwtAudience) signOptions.audience = this.jwtAudience;

    const accessToken = jwtModule.sign(payload, this.jwtSecret, signOptions);

    return {
      accessToken,
      user,
    };
  }
}
