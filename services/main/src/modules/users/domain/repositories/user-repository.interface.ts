import type { User } from '@users/domain/models/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  updateAvatar(id: string, avatarUrl: string): Promise<void>;
  anonymize(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
