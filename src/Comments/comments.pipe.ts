import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentDto } from './dto/comments.dto';

@Injectable()
export class CommentValidationPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(
    value: CommentDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: ArgumentMetadata,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: value.postId },
    });

    if (!post) {
      throw new HttpException('Post não existe', HttpStatus.BAD_REQUEST);
    }

    return value;
  }
}
