import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const posts = await this.prisma.post.findMany();
    return posts;
  }

  async findById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!post) {
      return 'Post não encontrado';
    }
    return post;
  }

  async createPost(postDto: CreatePostDto) {
    const data = { ...postDto };

    if (Object.keys(data).length === 0) {
      return 'page 404';
    }

    if (data.title.length < 3) {
      return 'Titulo deve ser maior que 3 caracteres';
    }

    if (!data.authorId) {
      return 'Post precisa de um autor';
    }

    const newpost = await this.prisma.post.create({
      data,
    });

    return newpost;
  }
}
