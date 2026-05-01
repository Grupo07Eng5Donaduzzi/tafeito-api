import {
  CreateUserDto,
  UpdateUserDto,
} from '@users/application/dto/create-user.dto';
import { UserDto } from '@users/application/dto/user.dto';
import { UserService } from '@users/application/services/user.service';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser() userId: string): Promise<UserDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException();
    return user;
  }

  @Get()
  async findAll() {
    return this.userService.list();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

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
