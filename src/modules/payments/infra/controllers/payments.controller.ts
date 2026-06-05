import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from '../../application/services/payments.service';
import { CreatePixPaymentDto } from '../../application/dto/create-pix-payment.dto';
import { PixPaymentDto } from '../../application/dto/pix-payment.dto';
import { PaymentStatusDto } from '../../application/dto/payment-status.dto';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  async createPix(@Body() dto: CreatePixPaymentDto): Promise<PixPaymentDto> {
    return this.paymentsService.createPix(dto);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string): Promise<PaymentStatusDto> {
    return this.paymentsService.getStatus(id);
  }

  @Post('webhook/asaas')
  async handleWebhook(@Body() payload: Record<string, any>): Promise<void> {
    const event = payload?.event as string | undefined;
    const paymentId = payload?.payment?.id as string | undefined;
    const externalReference = payload?.payment
      ?.externalReference as string | undefined;

    this.logger.log(
      `Webhook Asaas recebido: event=${event} paymentId=${paymentId} ref=${externalReference}`,
    );
  }
}
