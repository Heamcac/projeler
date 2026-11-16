import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionUser } from './types';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
  const req = ctx.switchToHttp().getRequest<{ session: { user?: SessionUser } }>();
  return req.session.user as SessionUser;
});
