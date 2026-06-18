import { UpdateUserDto } from '@users/application/dto/create-user.dto';
import { UserDto } from '@users/application/dto/user.dto';
import { UserService } from '@users/application/services/user.service';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { HateoasItem } from '@shared/infra/hateoas';
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
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @Get('me')
  @HateoasItem<UserDto>({
    basePath: '/users',
    itemLinks: (item) => ({
      self: { href: `/users/${item.id}`, method: 'GET' },
      update: { href: `/users/${item.id}`, method: 'PUT' },
      delete: { href: `/users/${item.id}`, method: 'DELETE' },
    }),
  })
  async getMe(@CurrentUser() userId: string): Promise<UserDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @Get(':id')
  @HateoasItem<UserDto>({
    basePath: '/users',
    itemLinks: (item) => ({
      self: { href: `/users/${item.id}`, method: 'GET' },
      update: { href: `/users/${item.id}`, method: 'PUT' },
      delete: { href: `/users/${item.id}`, method: 'DELETE' },
    }),
  })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  @ApiOperation({ summary: 'Atualiza os dados do usuário autenticado' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  async update(
    @CurrentUser() currentUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Operação não permitida');
    }
    await this.userService.edit(id, body);
  }

  @ApiOperation({ summary: 'Fazer upload do avatar do usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Foto de perfil (JPEG/PNG/WebP, máx 5 MB)',
        },
      },
    },
  })
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserDto> {
    return this.userService.uploadAvatar(userId, file.filename);
  }

  @ApiOperation({ summary: 'Remove a conta do usuário autenticado' })
  @ApiParam({ name: 'id', description: 'UUID do usuário' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @CurrentUser() currentUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException('Operação não permitida');
    }
    await this.userService.remove(id);
  }
}
