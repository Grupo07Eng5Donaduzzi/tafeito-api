import "dotenv/config";
import { OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";
export declare class FirebaseAuthService implements OnModuleInit {
    private auth;
    onModuleInit(): void;
    createUser(email: string, password: string): Promise<string>;
    deleteUser(uid: string): Promise<void>;
    getUserByEmail(email: string): Promise<admin.auth.UserRecord | null>;
    verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken>;
}
