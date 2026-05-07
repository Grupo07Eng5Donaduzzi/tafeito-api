export class CreatePixPaymentDto {
    amount!: number | string;
    payerEmail!: string;
    payerFirstName?: string;
    payerLastName?: string;
    payerDocumentType!: 'CPF' | 'CNPJ';
    payerDocumentNumber!: string;
}
