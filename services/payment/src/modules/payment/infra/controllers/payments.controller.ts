import { Body, Controller, Get, Logger, Param, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HateoasItem } from '@shared/infra/hateoas';
import { PaymentsService } from '../../application/services/payments.service';
import { PaymentMessagingService } from '../../application/services/payment-messaging.service';
import { PaymentRecordRepository, PAYMENT_RECORD_REPOSITORY } from '../../domain/repositories/payment-record-repository.interface';
import { CreatePixPaymentDto } from '../../application/dto/create-pix-payment.dto';
import { PixPaymentDto } from '../../application/dto/pix-payment.dto';
import { PaymentStatusDto } from '../../application/dto/payment-status.dto';
import { Inject } from '@nestjs/common';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentMessagingService: PaymentMessagingService,
    @Inject(PAYMENT_RECORD_REPOSITORY)
    private readonly paymentRecordRepository: PaymentRecordRepository,
  ) {}

  @ApiOperation({ summary: 'Criar um pagamento PIX (usado internamente via eventos)' })
  @Post('pix')
  async createPix(@Body() dto: CreatePixPaymentDto): Promise<PixPaymentDto> {
    return this.paymentsService.createPix(dto);
  }

  @ApiOperation({ summary: 'Consultar status do pagamento pelo ID Asaas' })
  @Get(':id/status')
  @HateoasItem<PaymentStatusDto>({
    basePath: '/payments',
    itemLinks: (item) => ({
      self: { href: `/payments/${item.id}/status`, method: 'GET' },
    }),
  })
  async getStatus(@Param('id') id: string): Promise<PaymentStatusDto> {
    return this.paymentsService.getStatus(id);
  }

  @ApiOperation({ summary: 'Webhook Asaas — dispara evento payment.confirmed ao confirmar pagamento' })
  @Post('webhook/asaas')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: Record<string, any>): Promise<void> {
    const event = payload?.event as string | undefined;
    const paymentId = payload?.payment?.id as string | undefined;

    this.logger.log(`Webhook Asaas: event=${event} paymentId=${paymentId}`);

    const PAID_EVENTS = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];
    if (!event || !PAID_EVENTS.includes(event) || !paymentId) return;

    const record = await this.paymentRecordRepository.findByAsaasPaymentId(paymentId);
    if (!record) {
      this.logger.warn(`No payment record found for asaas payment ${paymentId}`);
      return;
    }

    await this.paymentRecordRepository.updateStatus(record.id!, 'CONFIRMED');
    await this.paymentMessagingService.publishPaymentConfirmed({
      proposalId: record.proposalId,
      paymentId,
    });

    this.logger.log(`payment.confirmed published for proposal ${record.proposalId}`);
  }
}
