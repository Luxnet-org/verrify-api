import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { CustomJwtService } from 'src/token/jwt.service';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { UserType } from '../../user/enum/user-type.enum';

export interface UserInfo {
  userId: string;
  role: UserType;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: CustomJwtService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const bearerToken = this.extractTokenFromHeader(request);

    if (!bearerToken) {
      throw new UnauthorizedException('Invalid Token Credentials');
    }

    const payload = this.jwtService.verifyJwtToken(bearerToken);
    request['user'] = {
      userId: payload.userId,
      role: UserType[payload.role],
    };

    // if (!request.user) {
    //   request.user = { id: payload.userId, role: payload.role };
    // } else {
    //   request.user.id = payload.userId;
    // }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
