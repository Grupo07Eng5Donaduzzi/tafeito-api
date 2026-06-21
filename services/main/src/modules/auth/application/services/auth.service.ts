import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseAuthService } from '@users/infra/firebase/firebase-auth.service';
import { UserService } from '@users/application/services/user.service';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UserDto } from '@users/application/dto/user.dto';
import type { StringValue } from 'ms';
import jwt from 'jsonwebtoken';
import { AuthJwtPayload } from '../../domain/models/auth-jwt-payload.model';
import { BecomeProviderDto } from '../dto/become-provider.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

interface JwtModule {
  sign: (payload: AuthJwtPayload, secret: string, options?: any) => string;
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
        'JWT secret is not configured. Set the JWT_SECRET environment variable.',
      );
    }
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: UserDto }> {
    const firebaseUid = await this.firebaseAuthService.signInWithEmailAndPassword(email, password);

    const user = await this.userService.findByFirebaseUid(firebaseUid);
    if (!user || !user.id) {
      throw new UnauthorizedException('User not found or invalid credentials.');
    }

    return this.buildAuthResponse(user);
  }

  async register(dto: CreateUserDto): Promise<{ accessToken: string; user: UserDto }> {
    const user = await this.userService.create(dto);
    return this.buildAuthResponse(user);
  }

  async becomeProvider(userId: string, dto: BecomeProviderDto): Promise<UserDto> {
    return this.userService.edit(userId, {
      pixKey: dto.pixKey,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.firebaseAuthService.signInWithEmailAndPassword(user.email, dto.currentPassword);
    await this.firebaseAuthService.changePassword(user.firebaseUid, dto.newPassword);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.ensureFirebaseUserByEmail(email);
    if (!user) return;

    await this.firebaseAuthService.sendPasswordResetEmail(user.email);
  }

  private buildAuthResponse(user: UserDto): { accessToken: string; user: UserDto } {
    const payload: AuthJwtPayload = {
      sub: user.id!,
      uid: user.firebaseUid,
      email: user.email,
    };

    const accessToken = jwtModule.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    return { accessToken, user };
  }
}
