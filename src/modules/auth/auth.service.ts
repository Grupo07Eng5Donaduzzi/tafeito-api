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

interface JwtModule {
  sign: (payload: any, secret: string, options?: any) => string;
}

const jwtModule: JwtModule = jwt;

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: StringValue | number;

  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly userService: UserService,
  ) {
    this.jwtSecret = process.env.JWT_SECRET ?? '';
    this.jwtExpiresIn = (process.env.JWT_EXPIRES_IN as StringValue) ?? '1h';

    if (!this.jwtSecret) {
      throw new InternalServerErrorException(
        'JWT secret não está configurado. Defina a variável de ambiente JWT_SECRET.',
      );
    }
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

    const payload = {
      sub: user.id,
      uid: user.firebaseUid,
      email: user.email,
    };

    const signOptions = {
      expiresIn: this.jwtExpiresIn,
    };

    const accessToken = jwtModule.sign(payload, this.jwtSecret, signOptions);

    return {
      accessToken,
      user,
    };
  }
}
