import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'types/express';
import { UserService } from 'User/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService,
    private userService: UserService
  ) {}

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

    let payload: IUser;
    try {
      payload = await this.jwtService.verifyAsync<IUser>(token);
      const id = Number.parseInt(payload?.sub);
      const user = await this.userService.findByIdUser(id);
      if (!user) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request.user = payload;

    return true;
  }
}
