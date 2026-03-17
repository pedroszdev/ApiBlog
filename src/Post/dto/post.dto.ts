import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  content: string;

  @IsBoolean()
  published: boolean;

  @IsInt()
  @IsNotEmpty()
  authorId: number;
}
