import {
  CreateUserDto,
  UpdateUserDto,
} from '@users/application/dto/create-user.dto';
import { UserService } from '@users/application/services/user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.list();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/add')
  async create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Put('/update/:id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.userService.edit(id, body);
  }

  @Delete('/delete/:id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
