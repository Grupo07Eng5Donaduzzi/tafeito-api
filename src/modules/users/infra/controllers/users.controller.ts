import {
  CreateUserDto,
  UpdateUserDto,
} from '@users/application/dto/create-user.dto';
import { UserDto } from '@users/application/dto/user.dto';
import { UserService } from '@users/application/services/user.service';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

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

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/add')
  async create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }

  @Put('/update/:id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.userService.edit(id, body);
  }

  @Patch(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'profiles');
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${crypto.randomUUID()}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de arquivo inválido. Use JPEG, PNG ou WebP.',
            ),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserDto> {
    return this.userService.uploadPhoto(id, file);
  }

  @Delete('/delete/:id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
