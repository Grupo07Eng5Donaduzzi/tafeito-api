export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  identification: string; // CPF or CNPJ
}

export class UpdateUserDto {
  name?: string;
  identification?: string; // CPF or CNPJ
}
