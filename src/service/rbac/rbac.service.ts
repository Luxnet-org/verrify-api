import { Injectable } from '@nestjs/common';
import { UserRole } from '../../model/enum/role.enum';

interface IsAuthorizedParams {
  currentRole: UserRole;
  requiredRole: UserRole;
}

@Injectable()
export class RbacService {
  private hierarchies: Map<string, number>[] = [];
  private priority: number = 1;

  constructor() {
    this.buildRoles([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    this.buildRoles([UserRole.SUPPORT, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  private buildRoles(roles: UserRole[]): void {
    const hierarchy: Map<string, number> = new Map();
    roles.forEach((role) => {
      hierarchy.set(role, this.priority);
      this.priority++;
    });

    this.hierarchies.push(hierarchy);
  }

  public isAuthorized({
    currentRole,
    requiredRole,
  }: IsAuthorizedParams): boolean {
    for (const hierarchy of this.hierarchies) {
      const priority = hierarchy.get(currentRole);
      const requiredPriority = hierarchy.get(requiredRole);

      if (priority && requiredPriority && priority >= requiredPriority) {
        return true;
      }
    }
    return false;
  }
}
