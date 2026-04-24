import type { User } from "../models/user.entity";
export declare const USER_REPOSITORY: unique symbol;
export interface UserRepository {
    create(user: User): Promise<void>;
    update(user: User): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
    findByFirebaseUid(firebaseUid: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
}
