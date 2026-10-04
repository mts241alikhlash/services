export { PermissionModule } from './permission.module.js'
export { IPermissionRepository } from './domain/repositories/permission.repository.js'
export { PermissionGuard } from './guards/permission.guard.js'
export {
  RequirePermissions,
  PERMISSIONS_KEY,
} from './decorators/require-permissions.decorator.js'
export { PermissionResponseDto } from './presentation/http/dto/response/permission-response.dto.js'
export { AssignPermissionDto } from './presentation/http/dto/request/assign-permission.dto.js'
export type { SystemPermission } from './types/system-permission.type.js'
