import { CreateUserDto, UpdateUserDto } from "@users/application/dto/create-user.dto";
import { UserDto } from "@users/application/dto/user.dto";
import { User } from "@users/domain/models/user.entity";
import {
  USER_REPOSITORY,
  type UserRepository,
} from "@users/domain/repositories/user-repository.interface";
import { FirebaseAuthService } from "@users/infra/firebase/firebase-auth.service";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) { }

  async create(dto: CreateUserDto): Promise<UserDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException();
    }

    const firebaseUid = await this.firebaseAuthService.createUser(
      dto.email,
      dto.password,
    );

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
    if (!user) throw new NotFoundException();

    if (dto.name !== undefined) user.withName(dto.name);
    if (dto.identification !== undefined)
      user.withIdentification(dto.identification);

    await this.userRepository.update(user);

    const updated = await this.userRepository.findById(id);
    return UserDto.from(updated)!;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException();

    await this.firebaseAuthService.deleteUser(user.firebaseUid);
    await this.userRepository.delete(id);
  }

  async list(): Promise<UserDto[]> {
    const rows = await this.userRepository.findAll();
    return rows.map((row) => UserDto.from(row)!);
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
