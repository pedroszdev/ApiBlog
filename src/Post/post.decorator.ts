import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from 'src/Auth/tokenPayload';

export const UserId = createParamDecorator((ctx: ExecutionContext): number => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user.sub;
});

interface RequestWithUser extends Request {
  user: TokenPayload;
}
