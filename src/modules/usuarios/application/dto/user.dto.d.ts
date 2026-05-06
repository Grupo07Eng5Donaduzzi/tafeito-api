import type { User } from "../../domain/models/user.entity";
export declare class UserDto {
    id: string | undefined;
    firebaseUid: string;
    name: string;
    email: string;
    identification: string;
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
    private constructor();
    static from(user: User | null): UserDto | null;
}
