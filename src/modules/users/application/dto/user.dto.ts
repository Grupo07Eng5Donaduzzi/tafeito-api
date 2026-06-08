import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { User } from '@users/domain/models/user.entity';

export class UserDto {
  @ApiPropertyOptional()
  public id: string | undefined;

  @ApiProperty()
  public firebaseUid: string;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public email: string;

  @ApiProperty()
  public identification: string;

  @ApiPropertyOptional()
  public pixKey: string | undefined;

  @ApiPropertyOptional()
  public hourlyRate: number | undefined;

  @ApiPropertyOptional()
  public createdAt: Date | undefined;

  @ApiPropertyOptional()
  public updatedAt: Date | undefined;

  private constructor(
    id: string | undefined,
    firebaseUid: string,
    name: string,
    email: string,
    identification: string,
    pixKey: string | undefined,
    hourlyRate: number | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
  ) {
    this.id = id;
    this.firebaseUid = firebaseUid;
    this.name = name;
    this.email = email;
    this.identification = identification;
    this.pixKey = pixKey;
    this.hourlyRate = hourlyRate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static from(user: User | null): UserDto | null {
    if (!user) return null;
    return new UserDto(
      user.id,
      user.firebaseUid,
      user.name,
      user.email,
      user.identification,
      user.pixKey,
      user.hourlyRate,
      user.createdAt,
      user.updatedAt,
    );
  }
}
