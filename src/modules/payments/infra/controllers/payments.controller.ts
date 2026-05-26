import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from '../../application/services/payments.service';
import { CreatePixPaymentDto } from '../../application/dto/create-pix-payment.dto';
import { PixPaymentDto } from '../../application/dto/pix-payment.dto';
import { PaymentStatusDto } from '../../application/dto/payment-status.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('pix')
    async createPix(@Body() dto: CreatePixPaymentDto): Promise<PixPaymentDto> {
        return this.paymentsService.createPix(dto);
    }

    @Get(':id/status')
    async getStatus(@Param('id') id: string): Promise<PaymentStatusDto> {
        return this.paymentsService.getStatus(id);
    }
}
