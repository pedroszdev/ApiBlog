import { Injectable } from '@nestjs/common';
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
}
