import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(data: CommentDto, userId: number) {
    const comment = await this.prisma.comments.create({
      data: {
        comment: data.comment,
        authorId: userId,
        postId: data.postId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return comment;
  }

  async deleteComment(commentId: number) {
    await this.prisma.comments.delete({
      where: {
        id: commentId,
      },
    });

    return { message: 'Comentario apagado' };
  }

  async repliesComment(data: CommentDto, parentId: number, userId: number) {
    if (parentId) {
      const parent = await this.prisma.comments.findUnique({
        where: { id: parentId },
      });
      if (!parent) throw new NotFoundException('Comentário pai não existe');
      if (parent.postId !== data.postId)
        throw new BadRequestException('Pai é de outro post');

      const replie = await this.prisma.comments.create({
        data: {
          comment: data.comment,
          authorId: userId,
          postId: data.postId,
          parent_id: parentId,
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });

      return replie;
    }
  }
}
