export class PaymentStatusDto {
    id!: number;
    status!: string;
    statusDetail?: string;
    paid!: boolean;
}
