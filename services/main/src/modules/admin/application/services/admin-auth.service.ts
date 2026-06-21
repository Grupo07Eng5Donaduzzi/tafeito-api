import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { FirebaseAuthService } from '@users/infra/firebase/firebase-auth.service';
import { adminsSchema } from '../../infra/schemas/admin.schema';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly drizzleService: DrizzleService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; admin: { id: string; name: string; email: string } }> {
    const firebaseUid = await this.firebaseAuthService.signInWithEmailAndPassword(
      email,
      password,
    );

    const [admin] = await this.drizzleService.db
      .select()
      .from(adminsSchema)
      .where(eq(adminsSchema.firebaseUuid, firebaseUid))
      .limit(1);

    if (!admin) {
      throw new UnauthorizedException('Acesso negado. Usuário não é administrador.');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');

    const accessToken = jwt.sign(
      { sub: admin.id, uid: admin.firebaseUuid, email: admin.email },
      secret,
      { expiresIn: '8h' },
    );

    return {
      accessToken,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    };
  }
}
