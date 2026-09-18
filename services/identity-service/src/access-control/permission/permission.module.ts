import { Module, OnApplicationBootstrap } from '@nestjs/common'
import { PermissionController } from './presentation/http/permission.controller.js'
import { PrismaPermissionRepository } from './infrastructure/persistence/prisma/prisma-permission.repository.js'
import { IPermissionRepository } from './domain/repositories/permission.repository.js'
import { GetPermissionsUseCase } from './application/use-cases/get-permissions/get-permissions.use-case.js'
import { GetPermissionByIdUseCase } from './application/use-cases/get-permission-by-id/get-permission-by-id.use-case.js'
import { AssignPermissionToRoleUseCase } from './application/use-cases/assign-permission-to-role/assign-permission-to-role.use-case.js'
import { RemovePermissionFromRoleUseCase } from './application/use-cases/remove-permission-from-role/remove-permission-from-role.use-case.js'
import { SyncPermissionsUseCase } from './application/use-cases/sync-permissions/sync-permissions.use-case.js'
import { CreatePermissionUseCase } from './application/use-cases/create-permission/create-permission.use-case.js'
import { UpdatePermissionUseCase } from './application/use-cases/update-permission/update-permission.use-case.js'
import { DeletePermissionUseCase } from './application/use-cases/delete-permission/delete-permission.use-case.js'
import { PermissionGuard } from './guards/permission.guard.js'
import { RoleModule } from '../role/role.module.js'
import { AuthModule } from '../../auth/auth.module.js'

@Module({
  imports: [RoleModule, AuthModule],
  controllers: [PermissionController],
  providers: [
    { provide: IPermissionRepository, useClass: PrismaPermissionRepository },
    GetPermissionsUseCase,
    GetPermissionByIdUseCase,
    AssignPermissionToRoleUseCase,
    RemovePermissionFromRoleUseCase,
    SyncPermissionsUseCase,
    CreatePermissionUseCase,
    UpdatePermissionUseCase,
    DeletePermissionUseCase,
    PermissionGuard,
  ],
  exports: [IPermissionRepository, PermissionGuard],
})
export class PermissionModule implements OnApplicationBootstrap {
  constructor(private readonly syncPermissions: SyncPermissionsUseCase) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.syncPermissions.execute()
  }
}
