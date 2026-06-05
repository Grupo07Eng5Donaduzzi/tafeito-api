import { UpdateUserDto } from '@users/application/dto/create-user.dto';
import { UserDto } from '@users/application/dto/user.dto';
import { UserService } from '@users/application/services/user.service';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser() userId: string): Promise<UserDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserDto> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  async update(
    @CurrentUser() currentUserId: string,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Operação não permitida');
    }
    await this.userService.edit(id, body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @CurrentUser() currentUserId: string,
    @Param('id') id: string,
  ): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Operação não permitida');
    }
    await this.userService.remove(id);
  }
}
