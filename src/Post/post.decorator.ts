import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '../Auth/tokenPayload';

export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user.sub;
  },
);

export const OptionalUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: TokenPayload }>();
    return request.user?.sub;
  },
);

interface RequestWithUser extends Request {
  user: TokenPayload;
}
