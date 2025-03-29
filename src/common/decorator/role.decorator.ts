import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../model/enum/role.enum';

export const ROLES_KEY = 'role';
export const RequireRoles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
