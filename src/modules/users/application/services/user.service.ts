import {
  CreateUserDto,
  UpdateUserDto,
} from '@users/application/dto/create-user.dto';
import { UserDto } from '@users/application/dto/user.dto';
import { User } from '@users/domain/models/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@users/domain/repositories/user-repository.interface';
import { FirebaseAuthService } from '@users/infra/firebase/firebase-auth.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class UserService {
  private validateName(name: string): void {
    if (name.length < 4) {
      throw new BadRequestException('Name deve ter mais que 4 letrasy');
    }
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Formato de email inválido');
    }
  }

  private validatePassword(password: string): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException('Senha deve ter pelo menos 8 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)');
    }
  }

  private validateIdentification(identification: string): void {
    // Remove non-digits
    const clean = identification.replace(/\D/g, '');
    
    if (clean.length === 11) {
      // CPF validation
      if (!this.isValidCPF(clean)) {
        throw new BadRequestException('Invalid CPF');
      }
    } else if (clean.length === 14) {
      // CNPJ validation
      if (!this.isValidCNPJ(clean)) {
        throw new BadRequestException('Invalid CNPJ');
      }
    } else {
      throw new BadRequestException('Identification must be a valid CPF or CNPJ');
    }
  }

  private isValidCPF(cpf: string): boolean {
    if (/^(\d)\1{10}$/.test(cpf)) return false; // All digits same

    let sum = 0;
    let remainder;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  private isValidCNPJ(cnpj: string): boolean {
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let position = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * position--;
      if (position < 2) position = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size += 1;
    numbers += result;
    position = size - 7;
    sum = 0;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * position--;
      if (position < 2) position = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

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

    // Validate provided fields
    if (dto.name !== undefined && dto.name != null) {
      const nameTrimmed = (dto.name as string).trim();
      if (!nameTrimmed) {
        throw new BadRequestException('Nome não pode estar vazio');
      }
      this.validateName(nameTrimmed);
    }
    if (dto.email !== undefined && dto.email != null) {
      const emailTrimmed = (dto.email as string).trim();
      if (!emailTrimmed) {
        throw new BadRequestException('Email não pode estar vazio');
      }
      this.validateEmail(emailTrimmed);
    }
    if (dto.password !== undefined && dto.password != null) {
      const passwordTrimmed = (dto.password as string).trim();
      if (!passwordTrimmed) {
        throw new BadRequestException('Senha não pode estar vazia');
      }
      this.validatePassword(passwordTrimmed);
    }
    if (dto.identification !== undefined && dto.identification != null) {
      const identificationTrimmed = (dto.identification as string).trim();
      if (!identificationTrimmed) {
        throw new BadRequestException('Identification não pode estar vazio');
      }
      this.validateIdentification(identificationTrimmed);
    }
    // Use trimmedDto for updates below

    let emailTrimmed = '';
    if (dto.email !== undefined && dto.email != null) {
      emailTrimmed = (dto.email as string).trim();
    }

    let identificationTrimmed = '';
    if (dto.identification !== undefined && dto.identification != null) {
      identificationTrimmed = (dto.identification as string).trim();
    }

    if (emailTrimmed) {
      const existingEmail = await this.userRepository.findByEmail(emailTrimmed);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email já está sendo usado por outro usuário');
      }
      await this.firebaseAuthService.updateUser(user.firebaseUid, emailTrimmed);
      user.withEmail(emailTrimmed);
    }

    if (identificationTrimmed) {
      const allUsers = await this.userRepository.findAll();
      const existingIdentification = allUsers.find(u => u.identification === identificationTrimmed && u.id !== id);
      if (existingIdentification) {
        throw new ConflictException('Identification já está sendo usado por outro usuário');
      }
      user.withIdentification(identificationTrimmed);
    }

    if (dto.name !== undefined && dto.name != null) {
      const nameTrimmed = (dto.name as string).trim();
      user.withName(nameTrimmed);
    }

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
