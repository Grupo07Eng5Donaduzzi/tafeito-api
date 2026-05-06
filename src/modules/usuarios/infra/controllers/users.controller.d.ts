import { CreateUserDto, UpdateUserDto } from "../../application/dto/create-user.dto";
import { UserService } from "../../application/services/user.service";
export declare class UsersController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(): Promise<import("../../application/dto/user.dto").UserDto[]>;
    findById(id: string): Promise<import("../../application/dto/user.dto").UserDto | null>;
    create(body: CreateUserDto): Promise<import("../../application/dto/user.dto").UserDto>;
    update(id: string, body: UpdateUserDto): Promise<import("../../application/dto/user.dto").UserDto>;
    remove(id: string): Promise<void>;
}
