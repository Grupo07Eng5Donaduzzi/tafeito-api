import "dotenv/config";
import { Injectable, OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private auth: admin.auth.Auth;

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    this.auth = admin.auth();
  }

  async createUser(email: string, password: string): Promise<string> {
    const record = await this.auth.createUser({ email, password });
    return record.uid;
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

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return this.auth.verifyIdToken(token);
  }
}
