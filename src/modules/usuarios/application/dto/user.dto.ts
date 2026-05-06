import { User } from '../../domain/models/user.entity';

export class UserDto {
  id: string | undefined;
  firebaseUid: string;
  name: string;
  email: string;
  identification: string;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;

  private constructor() {}

  static from(user: User | null): UserDto | null {
    if (!user) return null;
    const dto = new UserDto();
    dto.id = user.id;
    dto.firebaseUid = user.firebaseUid;
    dto.name = user.name;
    dto.email = user.email;
    dto.identification = user.identification;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}