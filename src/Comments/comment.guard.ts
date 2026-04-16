import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from '../Auth/tokenPayload';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context
      .switchToHttp()
      .getRequest<Request & { user: TokenPayload }>();
    const user = request.user;
    const { id } = request.params;
    const idConvertido = Number.parseInt(id as string);
    const comment = await this.prisma.comments.findUnique({
      where: {
        id: idConvertido,
      },
    });

    if (!comment) {
      throw new HttpException('Comentario não existe', HttpStatus.NOT_FOUND);
    }

    if (user?.sub === comment.authorId) return true;

    throw new ForbiddenException(
      'Você não tem permissão para acessar esse recurso',
    );
  }
}
