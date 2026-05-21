import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from '../../application/services/payments.service';
import { CreatePixPaymentDto } from '../../application/dto/create-pix-payment.dto';
import { PixPaymentDto } from '../../application/dto/pix-payment.dto';
import { PaymentStatusDto } from '../../application/dto/payment-status.dto';
import { CurrentUser } from '@shared/infra/current-user.decorator';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('pix')
    async createPix(
        @CurrentUser() userId: string,
        @Body() dto: CreatePixPaymentDto,
    ): Promise<PixPaymentDto> {
        return this.paymentsService.createPix(userId, dto);
    }

    @Get(':id/status')
    async getStatus(
        @CurrentUser() userId: string,
        @Param('id') id: string,
    ): Promise<PaymentStatusDto> {
        return this.paymentsService.getStatus(userId, id);
    }
}
