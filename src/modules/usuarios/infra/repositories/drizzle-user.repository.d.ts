import { User } from "../../domain/models/user.entity";
import type { UserRepository } from "../../domain/repositories/user-repository.interface";
import { DrizzleService } from "../../../../shared/infra/database/drizzle.service";
export declare class DrizzleUserRepository implements UserRepository {
    private readonly drizzleService;
    constructor(drizzleService: DrizzleService);
    create(user: User): Promise<void>;
    update(user: User): Promise<void>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<User | null>;
    findByFirebaseUid(firebaseUid: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
}
