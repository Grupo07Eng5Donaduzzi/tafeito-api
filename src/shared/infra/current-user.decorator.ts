import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserDto } from '@users/application/dto/user.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user: UserDto }>();
    return request.user.id!;
  },
);
