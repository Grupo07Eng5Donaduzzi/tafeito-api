import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { InvoiceService } from './application/services/invoice.service';
import { InvoicesController } from './infra/controllers/invoices.controller';
import { DrizzleInvoiceRepository } from './infra/repositories/drizzle-invoice.repository';
import { INVOICE_REPOSITORY } from './domain/repositories/invoice-repository.interface';

@Module({
  imports: [SharedModule],
  controllers: [InvoicesController],
  providers: [
    InvoiceService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: DrizzleInvoiceRepository,
    },
  ],
})
export class InvoicesModule {}
