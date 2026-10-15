import { IsInt, IsOptional, Max, Min, min } from 'class-validator';

export class LikesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  postId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  commentId?: number;
}
