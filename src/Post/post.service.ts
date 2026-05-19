import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const posts = await this.prisma.post.findMany();
    return posts;
  }

  async findById(id: number, currentUserId?: number) {
    const myLikes = currentUserId
      ? ({ where: { authorId: currentUserId }, select: { id: true } } as const)
      : false;

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        _count: { select: { likes: true } },
        likes: myLikes,
        comments: {
          where: { parent_id: null },
          include: {
            author: { select: { id: true, name: true, email: true } },
            _count: { select: { likes: true } },
            likes: myLikes,
            replies: {
              include: {
                author: { select: { id: true, name: true, email: true } },
                _count: { select: { likes: true } },
                likes: myLikes,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new HttpException('Post não encontrado', HttpStatus.NOT_FOUND);
    }

    const shape = <
      T extends { _count: { likes: number }; likes?: { id: number }[] },
    >(
      x: T,
    ) => {
      const { _count, likes, ...rest } = x;
      return {
        ...rest,
        likesCount: _count.likes,
        likedByMe: (likes?.length ?? 0) > 0,
      };
    };

    return {
      ...shape(post),
      comments: post.comments.map((c) => ({
        ...shape(c),
        replies: c.replies.map(shape),
      })),
    };
  }

  async createPost(sub: number, postDto: CreatePostDto) {
    const data = { ...postDto };

    const newpost = await this.prisma.post.create({
      data: {
        title: data.title,
        authorId: sub,
        content: data.content,
        published: data.published,
      },
    });

    return newpost;
  }

  async updatePost(id: number, postDto: UpdatePostDto) {
    const data = { ...postDto };

    const newpost = await this.prisma.post.update({
      data,
      where: {
        id: id,
      },
    });

    return newpost;
  }

  async deletePost(id: number) {
    await this.prisma.post.delete({
      where: {
        id: id,
      },
    });

    return { message: 'Post apagado' };
  }
}
