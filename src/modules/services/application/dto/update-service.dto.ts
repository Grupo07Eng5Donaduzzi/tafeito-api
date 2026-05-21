export class CreateServiceDto {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  userId: string;
}

export class UpdateServiceDto {
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  duration?: string;
  userId?: string;
}