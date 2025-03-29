import { Injectable } from '@nestjs/common';
import { UserType } from '../user/enum/user-type.enum';

interface IsAuthorizedParams {
  currentRole: UserType;
  requiredRole: UserType;
}

@Injectable()
export class RbacService {
  private hierarchies: Map<string, number>[] = [];
  private priority: number = 1;

  constructor() {
    this.buildRoles([UserType.PATIENT, UserType.ADMIN, UserType.SUPER_ADMIN]);
    this.buildRoles([
      UserType.PATIENT,
      UserType.NURSE,
      UserType.DOCTOR,
      UserType.ADMIN,
      UserType.SUPER_ADMIN,
    ]);
    this.buildRoles([
      UserType.PATIENT,
      UserType.PHARMACIST,
      UserType.DOCTOR,
      UserType.ADMIN,
      UserType.SUPER_ADMIN,
    ]);
    this.buildRoles([
      UserType.PATIENT,
      UserType.RECEPTIONIST,
      UserType.DOCTOR,
      UserType.ADMIN,
      UserType.SUPER_ADMIN,
    ]);
    this.buildRoles([
      UserType.PATIENT,
      UserType.LAB_TECHNICIAN,
      UserType.DOCTOR,
      UserType.ADMIN,
      UserType.SUPER_ADMIN,
    ]);
  }

  private buildRoles(roles: UserType[]): void {
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
