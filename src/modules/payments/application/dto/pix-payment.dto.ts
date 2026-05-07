export class PixPaymentDto {
    id!: number;
    status!: string;
    amount!: number;
    payerEmail!: string;
    qrCode!: string;
    qrCodeBase64!: string;
    ticketUrl?: string;
}
