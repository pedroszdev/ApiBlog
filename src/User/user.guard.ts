import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from '../Auth/tokenPayload';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context
      .switchToHttp()
      .getRequest<Request & { user: TokenPayload }>();

    const user = request.user;
    const { id } = request.params;
    const idConvertido = Number.parseInt(id as string);
    if (user?.sub === idConvertido) {
      return true;
    }

    throw new ForbiddenException(
      'Você não tem permissão para acessar esse recurso',
    );
  }
}
