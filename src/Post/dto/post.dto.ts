import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  title: string;

  @IsString()
  @Length(3)
  content: string;

  @IsBoolean()
  @IsNotEmpty()
  published: boolean;

  @IsInt()
  @IsNotEmpty()
  authorId: number;
}

export class UpdatePostDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Length(3, 50)
  title: string;

  @IsString()
  @IsOptional()
  @Length(3)
  content: string;

  @IsBoolean()
  @IsOptional()
  published: boolean;
}
