import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'types/express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context
      .switchToHttp()
      .getRequest<Request & { user: IUser }>();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Cabeçalho de autorização ausente');
    }

    // Separa "Bearer" do token usando o espaço como divisor
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido');
    }

    const payload = await this.jwtService.verifyAsync<IUser>(token);

    if (!payload) throw new UnauthorizedException('Token inválido');

    request.user = payload;

    return true;
  }
}
