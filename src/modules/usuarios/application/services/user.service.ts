import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../../domain/models/user.entity';
import type { UserRepository } from '../../domain/repositories/user-repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user-repository.interface';
import { FirebaseAuthService } from '../../infra/firebase/firebase-auth.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDto> {
    // Create Firebase user
    const firebaseUid = await this.firebaseAuthService.createUser(dto.email, dto.password);

    // Create domain user
    const user = User.restore({
      firebaseUid,
      name: dto.name,
      email: dto.email,
      identification: dto.identification,
    });

    await this.userRepository.create(user!);
    const created = await this.userRepository.findByFirebaseUid(firebaseUid);

    return UserDto.from(created)!;
  }

  async edit(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields if provided
    if (dto.name) user.withName(dto.name);
    if (dto.identification) user.withIdentification(dto.identification);

    await this.userRepository.update(user);
    const updated = await this.userRepository.findById(id);

    return UserDto.from(updated)!;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(id);
  }

  async list(): Promise<UserDto[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => UserDto.from(user)!);
  }

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.userRepository.findById(id);
    return UserDto.from(user);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    return UserDto.from(user);
  }
}