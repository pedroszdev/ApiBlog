import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from '../Auth/tokenPayload';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context
      .switchToHttp()
      .getRequest<Request & { user: TokenPayload }>();
    const user = request.user;
    const { id } = request.params;
    const idConvertido = Number.parseInt(id as string);
    
    if (!idConvertido) {
      throw new BadRequestException('id precisa ser um número')
    }

    const post = await this.prisma.post.findUnique({
      where: {
        id: idConvertido,
      },
    });

    if (!post) {
      throw new NotFoundException('Post não existe');
    }

    if (Number(user?.sub) === post.authorId) return true;

    throw new ForbiddenException(
      'Você não tem permissão para acessar esse recurso',
    );
  }
}
