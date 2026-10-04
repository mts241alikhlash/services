import { Module, OnApplicationBootstrap } from '@nestjs/common'
import { RoleController } from './presentation/http/role.controller.js'
import { PrismaRoleRepository } from './infrastructure/persistence/prisma/prisma-role.repository.js'
import { IRoleRepository } from './domain/repositories/role.repository.js'
import { UserModule } from '../../user/user.module.js'
import { CreateRoleUseCase } from './application/use-cases/create-role/create-role.use-case.js'
import { GetRolesUseCase } from './application/use-cases/get-roles/get-roles.use-case.js'
import { GetRoleByIdUseCase } from './application/use-cases/get-role-by-id/get-role-by-id.use-case.js'
import { UpdateRoleUseCase } from './application/use-cases/update-role/update-role.use-case.js'
import { DeleteRoleUseCase } from './application/use-cases/delete-role/delete-role.use-case.js'
import { AssignRoleToUserUseCase } from './application/use-cases/assign-role-to-user/assign-role-to-user.use-case.js'
import { RemoveRoleFromUserUseCase } from './application/use-cases/remove-role-from-user/remove-role-from-user.use-case.js'
import { EnsureStructuralRolesUseCase } from './application/use-cases/ensure-structural-roles/ensure-structural-roles.use-case.js'
import { AuthModule } from '../../auth/auth.module.js'

@Module({
  imports: [UserModule, AuthModule],
  controllers: [RoleController],
  providers: [
    { provide: IRoleRepository, useClass: PrismaRoleRepository },
    CreateRoleUseCase,
    GetRolesUseCase,
    GetRoleByIdUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    AssignRoleToUserUseCase,
    RemoveRoleFromUserUseCase,
    EnsureStructuralRolesUseCase,
  ],
  exports: [IRoleRepository],
})
export class RoleModule implements OnApplicationBootstrap {
  constructor(
    private readonly ensureStructuralRoles: EnsureStructuralRolesUseCase,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureStructuralRoles.execute()
  }
}
