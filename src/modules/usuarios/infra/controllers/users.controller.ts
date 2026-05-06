import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '../../application/dto/create-user.dto';
import { UserDto } from '../../application/dto/user.dto';
import { UserService } from '../../application/services/user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): Promise<UserDto[]> {
    return this.userService.list();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<UserDto | null> {
    return this.userService.findById(id);
  }

  @Post()
  create(@Body() body: CreateUserDto): Promise<UserDto> {
    return this.userService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<UserDto> {
    return this.userService.edit(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}