import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js'
import { IPermissionRepository } from '../domain/repositories/permission.repository.js'

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

interface RequestUser {
  id: string
  roles?: string[]
  permissions?: string[]
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const roleCodes =
      user.roles ??
      (await this.permissionRepository.findUserRoles(user.id)).map(
        (userRole) => userRole.role.code,
      )

    if (roleCodes.includes(SUPER_ADMIN_ROLE)) {
      return true
    }

    const userPermissions =
      user.permissions ??
      (await this.permissionRepository.findUserPermissions(user.id))

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    )

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      )
    }

    return true
  }
}
