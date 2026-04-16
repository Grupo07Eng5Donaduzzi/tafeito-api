import { CreateUserDto, UpdateUserDto } from "@usuarios/application/dto/create-user.dto";
import { UserService } from "@usuarios/application/services/user.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

@Controller("usuarios")
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

  @Post()
  async create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: UpdateUserDto) {
    return this.userService.edit(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
