import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../../service/rbac/rbac.service';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorator/role.decorator';
import { Request } from 'express';
import { UserInfo } from './auth.guard';
import { UserRole } from '../../model/enum/role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles: UserRole[] = this.reflector.getAllAndOverride<
      UserRole[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user: UserInfo = request.user!;

    for (const role of requiredRoles) {
      const result = this.rbacService.isAuthorized({
        currentRole: user.role,
        requiredRole: role,
      });

      if (result) {
        return true;
      }
    }

    return false;
  }
}
