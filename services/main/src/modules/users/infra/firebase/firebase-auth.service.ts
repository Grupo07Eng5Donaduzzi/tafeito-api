import 'dotenv/config';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

const FIREBASE_CLIENT_ERRORS = new Set([
  'EMAIL_NOT_FOUND',
  'INVALID_EMAIL',
  'INVALID_LOGIN_CREDENTIALS',
  'USER_DISABLED',
  'MISSING_EMAIL',
  'WEAK_PASSWORD',
]);

function mapFirebaseAdminError(err: unknown, context: string): never {
  const code: string = (err as { code?: string })?.code ?? '';
  const message: string = (err as { message?: string })?.message ?? String(err);

  if (code === 'auth/email-already-exists') {
    throw new ConflictException('E-mail já cadastrado');
  }
  if (code === 'auth/user-not-found') {
    throw new NotFoundException('Usuário não encontrado no Firebase');
  }
  if (code === 'auth/invalid-email') {
    throw new BadRequestException('Formato de e-mail inválido');
  }
  if (code === 'auth/weak-password') {
    throw new BadRequestException('Senha muito fraca');
  }

  throw new InternalServerErrorException(`Erro Firebase (${context}): ${message}`);
}

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private auth: admin.auth.Auth;

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    this.auth = admin.auth();
  }

  async createUser(email: string, password: string): Promise<string> {
    try {
      const record = await this.auth.createUser({ email, password });
      return record.uid;
    } catch (err) {
      mapFirebaseAdminError(err, 'createUser');
    }
  }

  async updateUser(uid: string, email?: string): Promise<void> {
    try {
      await this.auth.updateUser(uid, { email });
    } catch (err) {
      mapFirebaseAdminError(err, 'updateUser');
    }
  }

  async setCustomUserClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
    try {
      const record = await this.auth.getUser(uid);
      const existingClaims = record.customClaims ?? {};
      await this.auth.setCustomUserClaims(uid, { ...existingClaims, ...claims });
    } catch (err) {
      mapFirebaseAdminError(err, 'setCustomUserClaims');
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (err) {
      mapFirebaseAdminError(err, 'deleteUser');
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    try {
      return await this.auth.getUserByEmail(email);
    } catch {
      return null;
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<string> {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('FIREBASE_API_KEY is not configured.');
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );

    type FirebaseSignInResponse = { localId?: string; [key: string]: unknown };
    const payload = (await response.json()) as FirebaseSignInResponse;

    if (!response.ok || !payload.localId) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return payload.localId;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('FIREBASE_API_KEY is not configured.');
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
      },
    );

    if (!response.ok) {
      type FirebaseErrorResponse = { error?: { message?: string } };
      const data = (await response.json()) as FirebaseErrorResponse;
      const errorCode = data?.error?.message ?? '';

      if (FIREBASE_CLIENT_ERRORS.has(errorCode)) {
        throw new BadRequestException('E-mail inválido ou não encontrado');
      }
      throw new InternalServerErrorException('Falha ao enviar e-mail de recuperação de senha');
    }
  }

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(token);
  }
}
