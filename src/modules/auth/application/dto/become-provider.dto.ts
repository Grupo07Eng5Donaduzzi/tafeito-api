import { IsString, MaxLength } from 'class-validator';

export class BecomeProviderDto {
  @IsString()
  @MaxLength(100)
  pixKey: string;
}
