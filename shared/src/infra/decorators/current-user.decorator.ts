import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user?: { id?: string } }>();
    if (!request.user?.id) throw new UnauthorizedException('Usuário não autenticado');
    return request.user.id;
  },
);
