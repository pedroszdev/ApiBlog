import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
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
    const request: Request = context.switchToHttp().getRequest<Request>();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Cabeçalho de autorização ausente');
    }

    // Separa "Bearer" do token usando o espaço como divisor
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      const { sub } = payload;
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
      if (sub === post.authorId) {
        return true;
      }
      return false;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
