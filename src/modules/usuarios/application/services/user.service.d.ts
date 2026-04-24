import { CreateUserDto, UpdateUserDto } from "../dto/create-user.dto";
import { UserDto } from "../dto/user.dto";
import { type UserRepository } from "../../domain/repositories/user-repository.interface";
import { FirebaseAuthService } from "../../infra/firebase/firebase-auth.service";
export declare class UserService {
    private readonly userRepository;
    private readonly firebaseAuthService;
    constructor(userRepository: UserRepository, firebaseAuthService: FirebaseAuthService);
    create(dto: CreateUserDto): Promise<UserDto>;
    edit(id: string, dto: UpdateUserDto): Promise<UserDto>;
    remove(id: string): Promise<void>;
    list(): Promise<UserDto[]>;
    findById(id: string): Promise<UserDto | null>;
    findByFirebaseUid(firebaseUid: string): Promise<UserDto | null>;
}
