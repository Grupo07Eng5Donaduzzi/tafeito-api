import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infra/guards/jwt-auth.guard';

type HttpRequest = {
  method?: string;
  path?: string;
  url?: string;
};

@Injectable()
export class PaymentAuthGuard extends JwtAuthGuard {
  protected isPublicPath(request: HttpRequest): boolean {
    const path = request.path ?? request.url ?? '';
    if (path.startsWith('/docs')) return true;
    if (request.method === 'POST' && path.includes('/payments/webhook')) return true;
    return false;
  }
}
