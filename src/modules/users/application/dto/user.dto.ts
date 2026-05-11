import type { User } from '@users/domain/models/user.entity';

export class UserDto {
  private constructor(
    public id: string | undefined,
    public firebaseUid: string,
    public name: string,
    public email: string,
    public identification: string,
    public hourlyRate: number | undefined,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
  ) {}

  public static from(user: User | null): UserDto | null {
    if (!user) return null;
    return new UserDto(
      user.id,
      user.firebaseUid,
      user.name,
      user.email,
      user.identification,
      user.hourlyRate,
      user.createdAt,
      user.updatedAt,
    );
  }
}
