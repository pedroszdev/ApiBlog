import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../Auth/tokenPayload';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

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
      if (sub === idConvertido) {
        return true;
      }
      return false;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
