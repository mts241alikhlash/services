import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js'

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

interface RequestUser {
  id: string
  roles: string[]
  permissions: string[]
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('Access denied. User not authenticated.')
    }

    if (user.roles.includes(SUPER_ADMIN_ROLE)) {
      return true
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    )

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      )
    }

    return true
  }
}
