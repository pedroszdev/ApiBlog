import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class LikesDto {
  @IsOptional()
  @IsNumber()
  postId?: number;

  @IsOptional()
  @IsNumber()
  commentId?: number;
}
