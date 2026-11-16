import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { RoleCode, SessionUser } from './types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const req = context.switchToHttp().getRequest<{ session: { user?: SessionUser } }>();
    const user = req.session.user;
    if (!user || !required.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return true;
  }
}
