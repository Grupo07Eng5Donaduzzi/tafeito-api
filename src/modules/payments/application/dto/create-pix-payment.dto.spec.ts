import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePixPaymentDto } from './create-pix-payment.dto';

const validBase = {
  amount: 99.9,
  payerEmail: 'user@example.com',
  payerDocumentType: 'CPF',
  payerDocumentNumber: '12345678901',
};

describe('CreatePixPaymentDto', () => {
  it('accepts valid payload', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, validBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid email', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, {
      ...validBase,
      payerEmail: 'not-an-email',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'payerEmail')).toBe(true);
  });

  it('rejects invalid documentType', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, {
      ...validBase,
      payerDocumentType: 'RG',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'payerDocumentType')).toBe(true);
  });

  it('rejects missing amount', async () => {
    const { amount, ...rest } = validBase;
    const dto = plainToInstance(CreatePixPaymentDto, rest);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  it('rejects firstName over 100 chars', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, {
      ...validBase,
      payerFirstName: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'payerFirstName')).toBe(true);
  });
});
