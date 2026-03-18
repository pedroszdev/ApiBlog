import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
      throw new HttpException('Post não encontrado', HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async createPost(postDto: CreatePostDto) {
    const data = { ...postDto };

    if (Object.keys(data).length === 0) {
      throw new HttpException(
        'Precisa ser enviado algum parametro',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.title.length < 3) {
      throw new HttpException(
        'O titulo precisa tem mais de 3 caracteres',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!data.authorId) {
      throw new HttpException(
        'Post precisa de um autor',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newpost = await this.prisma.post.create({
      data,
    });

    return newpost;
  }
}
