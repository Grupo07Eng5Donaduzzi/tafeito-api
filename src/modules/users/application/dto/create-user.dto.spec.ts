import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('rejects name longer than 100 chars', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'a'.repeat(101),
      email: 'test@test.com',
      password: 'password123',
      identification: '12345678901',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects email longer than 254 chars', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Valid Name',
      email: 'a'.repeat(245) + '@test.com',
      password: 'password123',
      identification: '12345678901',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects password shorter than 8 chars', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Valid Name',
      email: 'test@test.com',
      password: 'abc',
      identification: '12345678901',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects password longer than 128 chars', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Valid Name',
      email: 'test@test.com',
      password: 'a'.repeat(129),
      identification: '12345678901',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects identification longer than 50 chars', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Valid Name',
      email: 'test@test.com',
      password: 'password123',
      identification: 'a'.repeat(51),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'identification')).toBe(true);
  });

  it('accepts a valid DTO', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Valid Name',
      email: 'test@test.com',
      password: 'password123',
      identification: '12345678901',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
