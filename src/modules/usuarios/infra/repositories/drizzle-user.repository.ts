import { Injectable } from '@nestjs/common';
import { User } from '../../domain/models/user.entity';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import { usersSchema } from '../schemas/user.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(user: User): Promise<void> {
    await this.drizzleService.db.insert(usersSchema).values({
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      identification: user.identification,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(user: User): Promise<void> {
    await this.drizzleService.db
      .update(usersSchema)
      .set({
        name: user.name,
        identification: user.identification,
        updatedAt: new Date(),
      })
      .where(eq(usersSchema.id, user.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db.delete(usersSchema).where(eq(usersSchema.id, id));
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const result = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.firebaseUid, firebaseUid))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.email, email))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const result = await this.drizzleService.db
      .select()
      .from(usersSchema)
      .orderBy(usersSchema.createdAt);

    return result.map(this.mapToEntity);
  }

  private mapToEntity(row: any): User {
    return User.restore({
      id: row.id,
      firebaseUid: row.firebaseUid,
      name: row.name,
      email: row.email,
      identification: row.identification,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })!;
  }
}