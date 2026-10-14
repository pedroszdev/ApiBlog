import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikesDto } from './dto/likes.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async likePost(data: LikesDto, userId: number) {
    if (data.postId) {
      const post = await this.prisma.post.findUnique({
        where: {
          id: data.postId,
        },
      });
      if (!post) {
        throw new NotFoundException('post não existe');
      }
      try {
        const like = await this.prisma.likes.create({
          data: {
            postId: data.postId,
            authorId: userId,
          },
        });
        return like;
      } catch (e) {
        // P2002 = unique constraint violation
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException('Você já curtiu');
        }
        throw e;
      }
    }

    throw new BadRequestException('Necessario mandar postId');
  }

  async unLikePost(data: LikesDto, userId: number) {
    if (data.postId) {
      const like = await this.prisma.likes.findFirst({
        where: {
          postId: data.postId,
          authorId: userId,
        },
      });
      if (!like) {
        throw new NotFoundException('like não existe');
      }
      await this.prisma.likes.deleteMany({
        where: {
          postId: data.postId,
          authorId: userId,
        },
      });
      return { message: 'descurtido' };
    }

    throw new BadRequestException('Necessario mandar postId');
  }

  async likeComment(data: LikesDto, userId: number) {
    if (data.commentId) {
      const comment = await this.prisma.comments.findUnique({
        where: {
          id: data.commentId,
        },
      });
      if (!comment) {
        throw new NotFoundException('comentario não existe');
      }
      try {
        const like = await this.prisma.likes.create({
          data: {
            commentId: data.commentId,
            authorId: userId,
          },
        });
        return like;
      } catch (e) {
        // P2002 = unique constraint violation
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException('Você já curtiu');
        }
        throw e;
      }
    }

    throw new BadRequestException('Necessario mandar commentId');
  }

  async unLikeComment(data: LikesDto, userId: number) {
    if (data.commentId) {
      const like = await this.prisma.likes.findFirst({
        where: {
          commentId: data.commentId,
          authorId: userId,
        },
      });
      if (!like) {
        throw new NotFoundException('like não existe');
      }
      await this.prisma.likes.deleteMany({
        where: {
          commentId: data.commentId,
          authorId: userId,
        },
      });
      return { message: 'descurtido' };
    }

    throw new BadRequestException('Necessario mandar commentId');
  }
}
