import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginUserDto } from './login-user.dto';

describe('LoginUserDto', () => {
  it('rejects email longer than 254 chars', async () => {
    const dto = plainToInstance(LoginUserDto, {
      email: 'a'.repeat(246) + '@test.com',
      password: 'password123',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects password shorter than 8 chars', async () => {
    const dto = plainToInstance(LoginUserDto, {
      email: 'test@test.com',
      password: 'abc',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects password longer than 128 chars', async () => {
    const dto = plainToInstance(LoginUserDto, {
      email: 'test@test.com',
      password: 'a'.repeat(129),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('accepts valid credentials', async () => {
    const dto = plainToInstance(LoginUserDto, {
      email: 'test@test.com',
      password: 'password123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
