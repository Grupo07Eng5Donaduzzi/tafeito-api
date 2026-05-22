import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InvoiceService } from '../../application/services/invoice.service';
import { MAX_FILE_SIZE } from '../../domain/models/invoice.entity';

const PAYMENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function requireUserId(req: any): string {
  const userId = req.user?.id;
  if (typeof userId !== 'string' || !userId) {
    throw new UnauthorizedException('Usuário não autenticado');
  }
  return userId;
}

function assertPaymentId(value: string): string {
  if (!PAYMENT_ID_RE.test(value)) {
    throw new BadRequestException('paymentId inválido');
  }
  return value;
}

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoiceService) {}

  @Post(':paymentId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    }),
  )
  upload(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = requireUserId(req);
    return this.service.upload({
      paymentId: assertPaymentId(paymentId),
      file,
      uploadedByUserId: userId,
    });
  }

  @Get(':paymentId')
  listByPayment(@Param('paymentId') paymentId: string, @Req() req: any) {
    const userId = requireUserId(req);
    return this.service.listByPayment(assertPaymentId(paymentId), userId);
  }

  @Get(':id/download')
  getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const userId = requireUserId(req);
    return this.service.getDownloadUrl(id, userId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const userId = requireUserId(req);
    return this.service.remove(id, userId);
  }
}
