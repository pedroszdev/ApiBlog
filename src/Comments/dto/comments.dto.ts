import { IsInt, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  comment!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  postId!: number;
}
