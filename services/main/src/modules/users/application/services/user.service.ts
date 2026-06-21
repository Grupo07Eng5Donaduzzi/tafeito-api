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
    if (name.trim().length < 3) {
      throw new BadRequestException('Nome deve ter pelo menos 3 caracteres');
    }
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Formato de e-mail inválido');
    }
  }

  private validatePassword(password: string): void {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Senha deve ter pelo menos 8 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)',
      );
    }
  }

  private validatePixKey(pixKey: string): string {
    if (typeof pixKey !== 'string') {
      throw new BadRequestException('Chave Pix deve ser uma string');
    }
    const trimmed = pixKey.trim();
    if (!trimmed) {
      throw new BadRequestException('Chave Pix não pode estar vazia');
    }
    return trimmed;
  }

  private validateIdentification(identification: string): void {
    const clean = identification.replace(/\D/g, '');

    if (clean.length === 11) {
      if (!this.isValidCPF(clean)) {
        throw new BadRequestException('CPF inválido');
      }
    } else if (clean.length === 14) {
      if (!this.isValidCNPJ(clean)) {
        throw new BadRequestException('CNPJ inválido');
      }
    } else {
      throw new BadRequestException(
        'Identificação deve ser um CPF ou CNPJ válido',
      );
    }
  }

  private isValidCPF(cpf: string): boolean {
    if (/^(\d)\1{10}$/.test(cpf)) return false;

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
    this.validateName(dto.name);
    this.validateEmail(dto.email);
    this.validatePassword(dto.password);
    this.validateIdentification(dto.identification);

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const pixKeyTrimmed =
      dto.pixKey !== undefined && dto.pixKey !== null
        ? this.validatePixKey(dto.pixKey)
        : undefined;

    const firebaseUid = await this.firebaseAuthService.createUser(
      dto.email,
      dto.password,
    );

    if (pixKeyTrimmed) {
      await this.firebaseAuthService.setCustomUserClaims(firebaseUid, {
        pixKey: pixKeyTrimmed,
        provider: true,
      });
    }

    const user = User.restore({
      firebaseUid,
      name: dto.name,
      email: dto.email,
      identification: dto.identification,
      pixKey: pixKeyTrimmed,
    });

    await this.userRepository.create(user!);

    const created = await this.userRepository.findByFirebaseUid(firebaseUid);
    return UserDto.from(created)!;
  }

  async edit(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');

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
        throw new BadRequestException('E-mail não pode estar vazio');
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
        throw new BadRequestException('Identificação não pode estar vazia');
      }
      this.validateIdentification(identificationTrimmed);
    }
    if (dto.pixKey !== undefined && dto.pixKey != null) {
      this.validatePixKey(dto.pixKey as string);
    }
    let emailTrimmed = '';
    if (dto.email !== undefined && dto.email != null) {
      emailTrimmed = (dto.email as string).trim();
    }

    let identificationTrimmed = '';
    if (dto.identification !== undefined && dto.identification != null) {
      identificationTrimmed = (dto.identification as string).trim();
    }

    if (emailTrimmed) {
      const existingEmail =
        await this.userRepository.findByEmail(emailTrimmed);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(
          'E-mail já está sendo usado por outro usuário',
        );
      }
      await this.firebaseAuthService.updateUser(user.firebaseUid, emailTrimmed);
      user.withEmail(emailTrimmed);
    }

    if (identificationTrimmed) {
      const allUsers = await this.userRepository.findAll();
      const existingIdentification = allUsers.find(
        (u) => u.identification === identificationTrimmed && u.id !== id,
      );
      if (existingIdentification) {
        throw new ConflictException(
          'Identificação já está sendo usada por outro usuário',
        );
      }
      user.withIdentification(identificationTrimmed);
    }

    if (dto.name !== undefined && dto.name != null) {
      const nameTrimmed = (dto.name as string).trim();
      user.withName(nameTrimmed);
    }

    if (dto.pixKey !== undefined && dto.pixKey != null) {
      const pixKeyTrimmed = this.validatePixKey(dto.pixKey as string);
      await this.firebaseAuthService.setCustomUserClaims(user.firebaseUid, {
        pixKey: pixKeyTrimmed,
        provider: true,
      });
      user.withPixKey(pixKeyTrimmed);
    }

    await this.userRepository.update(user);

    const updated = await this.userRepository.findById(id);
    return UserDto.from(updated)!;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.firebaseAuthService.deleteUser(user.firebaseUid);
    await this.userRepository.anonymize(id);
  }

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.userRepository.findById(id);
    return UserDto.from(user);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    return UserDto.from(user);
  }

  async ensureFirebaseUserByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByEmail(email.trim());
    if (!user?.id) return null;

    const firebaseUid = await this.firebaseAuthService.ensureUserByEmail(user.email);
    if (user.firebaseUid !== firebaseUid) {
      await this.userRepository.updateFirebaseUid(user.id, firebaseUid);
      user.withFirebaseUid(firebaseUid);
    }

    if (user.pixKey) {
      await this.firebaseAuthService.setCustomUserClaims(firebaseUid, {
        pixKey: user.pixKey,
        provider: true,
      });
    }

    return UserDto.from(user);
  }

  async uploadAvatar(id: string, filename: string): Promise<UserDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.userRepository.updateAvatar(id, filename);
    const updated = await this.userRepository.findById(id);
    return UserDto.from(updated)!;
  }
}
