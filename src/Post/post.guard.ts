import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from 'src/Auth/tokenPayload';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context
      .switchToHttp()
      .getRequest<Request & { user: TokenPayload }>();
    const user = request.user;
    const { id } = request.params;
    const idConvertido = Number.parseInt(id as string);
    const post = await this.prisma.post.findUnique({
      where: {
        id: idConvertido,
      },
    });

    if (!post) {
      throw new HttpException('Post não existe', HttpStatus.NOT_FOUND);
    }

    if (user?.sub === post.authorId) return true;

    return false;
  }
}
