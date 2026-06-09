import 'dotenv/config';
import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

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
    const record = await this.auth.createUser({ email, password });
    return record.uid;
  }

  async updateUser(uid: string, email?: string): Promise<void> {
    await this.auth.updateUser(uid, { email });
  }

  async setCustomUserClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
    const record = await this.auth.getUser(uid);
    const existingClaims = record.customClaims ?? {};
    await this.auth.setCustomUserClaims(uid, { ...existingClaims, ...claims });
  }

  async deleteUser(uid: string): Promise<void> {
    await this.auth.deleteUser(uid);
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
      const message = data?.error?.message ?? 'Failed to send password reset email';
      throw new InternalServerErrorException(message);
    }
  }

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(token);
  }
}
