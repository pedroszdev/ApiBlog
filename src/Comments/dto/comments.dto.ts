import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  comment!: string;

  @IsNotEmpty()
  @IsNumber()
  postId!: number;
}
