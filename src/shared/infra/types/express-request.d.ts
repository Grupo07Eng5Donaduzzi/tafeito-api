import type { UserDto } from '@users/application/dto/user.dto';

declare global {
  namespace Express {
    interface Request {
      user?: UserDto;
    }
  }
}

export {};
