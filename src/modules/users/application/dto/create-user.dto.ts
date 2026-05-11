export class CreateUserDto {
  name!: string;
  email!: string;
  password!: string;
  identification!: string; // CPF or CNPJ
  hourlyRate?: number;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  identification?: string; // CPF or CNPJ
  hourlyRate?: number;
}
