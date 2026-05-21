import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InvoiceService } from '../../application/services/invoice.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoiceService) {}

  @Post(':paymentId/upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user?.id as string;
    return this.service.upload({ paymentId, file, uploadedByUserId: userId });
  }

  @Get(':paymentId')
  listByPayment(@Param('paymentId') paymentId: string) {
    return this.service.listByPayment(paymentId);
  }

  @Get(':id/download')
  getDownloadUrl(@Param('id') id: string) {
    return this.service.getDownloadUrl(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id as string;
    return this.service.remove(id, userId);
  }
}
