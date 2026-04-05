import { CreateUserDto, UpdateUserDto } from "@users/application/dto/create-user.dto";
import { UserService } from "@users/application/services/user.service";
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@users/infra/firebase/firebase-auth.guard";
import { CurrentUser } from "@users/infra/firebase/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async findAll() {
    return this.userService.list();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.userService.findById(id);
  }

  @Post("/add")
  async create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Put("/update/:id")
  @UseGuards(FirebaseAuthGuard)
  async update(@Param("id") id: string, @Body() body: UpdateUserDto, @CurrentUser() currentUser) {
    const user = await this.userService.findById(id);
    if (!user || user.firebaseUid !== currentUser.uid) {
      throw new ForbiddenException('Você só pode atualizar seu próprio perfil');
    }
    return this.userService.edit(id, body);
  }

  @Delete("/delete/:id")
  async remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
