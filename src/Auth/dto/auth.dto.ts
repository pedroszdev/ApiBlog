import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail({})
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  password: string;
}

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
