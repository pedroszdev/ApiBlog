import { Body, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page: number,
    limit: number,
    sort: Prisma.SortOrder = 'desc',
    search = '',
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.PostWhereInput =
      search.length > 0
        ? {
            published: true,
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ],
          }
        : { published: true };


    const [posts, totalCount] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip: skip,
        take: limit,
        orderBy: { createdAt: sort },
        where,
        include: {
          author: {select: { name: true }},
          _count: { select: { likes: true, comments: true } },
        },
      
      }),
      this.prisma.post.count({ where }),
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);

    return { posts, totalCount, page, totalPages, limit };
  }

  async findById(id: number, currentUserId?: number) {
    const myLikes = currentUserId
      ? ({ where: { authorId: currentUserId }, select: { id: true } } as const)
      : false;

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, bio: true } },
        _count: { select: { likes: true, comments: true } },
        likes: myLikes,
        comments: {
          where: { parent_id: null },
          include: {
            author: { select: { id: true, name: true } },
            _count: { select: { likes: true } },
            likes: myLikes,
            replies: {
              include: {
                author: { select: { id: true, name: true } },
                _count: { select: { likes: true } },
                likes: myLikes,
              },
            },
          },
        },
      },
    
    });

    // Rascunho só é visível para o próprio autor
    if (!post || (!post.published && post.authorId !== currentUserId)) {
      throw new NotFoundException('Post não encontrado');
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
