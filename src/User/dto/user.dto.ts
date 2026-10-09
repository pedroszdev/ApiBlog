import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { CreatePostDto } from '../../Post/dto/post.dto';
import { Exclude } from 'class-transformer';

export class CreateUserDto {
  @IsEmail({})
  @IsNotEmpty()
  email!: string;

  @IsString({})
  @IsNotEmpty()
  @Length(3, 50)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  password!: string;
}

export class UpdateUserDto {
  @IsEmail({})
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @IsString({})
  @IsNotEmpty()
  @Length(3, 50)
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  @IsOptional()
  password?: string;
}

export class UserEntity {
  id?: number;
  name?: string;
  email?: string;

  @Exclude()
  password?: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}