import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../types/express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: IUser }>();

    const authHeader = request.headers.authorization;
    if (!authHeader) return true;

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return true;

    try {
      request.user = await this.jwtService.verifyAsync<IUser>(token);
    } catch {
      // token inválido ou expirado — segue como visitante
    }

    return true;
  }
}
