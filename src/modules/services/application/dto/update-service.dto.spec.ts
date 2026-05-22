import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateServiceDto } from './update-service.dto';

describe('UpdateServiceDto', () => {
  it('rejects name longer than 100 chars', async () => {
    const dto = plainToInstance(UpdateServiceDto, {
      name: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects description longer than 500 chars', async () => {
    const dto = plainToInstance(UpdateServiceDto, {
      description: 'a'.repeat(501),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rejects category longer than 100 chars', async () => {
    const dto = plainToInstance(UpdateServiceDto, {
      category: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'category')).toBe(true);
  });

  it('accepts a valid partial DTO', async () => {
    const dto = plainToInstance(UpdateServiceDto, {
      name: 'Haircut',
      description: 'A simple haircut service',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts an empty DTO (all fields optional)', async () => {
    const dto = plainToInstance(UpdateServiceDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
