export class PixPaymentDto {
    id!: string;
    status!: string;
    amount!: number;
    payerEmail!: string;
    qrCode!: string;
    qrCodeBase64!: string;
    ticketUrl?: string;
}
