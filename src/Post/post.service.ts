import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

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

    const newpost = await this.prisma.post.create({
      data,
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

    return new HttpException('User Apagado', HttpStatus.OK);
  }
}
