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

  canActivate(context: ExecutionContext): boolean {
    try {
      const request: Request = context
        .switchToHttp()
        .getRequest<Request & { user: TokenPayload }>();

      const user = request.user;
      const { id } = request.params;
      const idConvertido = Number.parseInt(id as string);
      if (user?.sub === idConvertido) {
        return true;
      }
      return false;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
