import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreatePostDto } from 'src/Post/dto/post.dto';
export class CreateUserDto {
  @IsEmail({}, { message: 'O e-mail fornecido é invalido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  post: [CreatePostDto];
}
