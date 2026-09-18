import { Module } from '@nestjs/common'
import { UserController } from './presentation/http/user.controller.js'
import { AccountsController } from './presentation/http/accounts.controller.js'
import { ProfilesController } from './presentation/http/profiles.controller.js'
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user.repository.js'
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case.js'
import { DeleteUserUseCase } from './application/use-cases/delete-user/delete-user.use-case.js'
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id/get-user-by-id.use-case.js'
import { GetUserSummaryUseCase } from './application/use-cases/get-user-summary/get-user-summary.use-case.js'
import { GetUsersUseCase } from './application/use-cases/get-users/get-users.use-case.js'
import { UpdateUserUseCase } from './application/use-cases/update-user/update-user.use-case.js'
import { ProvisionAccountUseCase } from './application/use-cases/provision-account/provision-account.use-case.js'
import { GetProfilesByIdsUseCase } from './application/use-cases/get-profiles-by-ids/get-profiles-by-ids.use-case.js'
import { SetAccountActiveUseCase } from './application/use-cases/set-account-active/set-account-active.use-case.js'
import { UpdateAccountProfileUseCase } from './application/use-cases/update-account-profile/update-account-profile.use-case.js'
import { LookupAccountUseCase } from './application/use-cases/lookup-account/lookup-account.use-case.js'
import { AssignAccountRoleUseCase } from './application/use-cases/assign-account-role/assign-account-role.use-case.js'
import { IUserRepository } from './domain/repositories/user.repository.js'
import { ProvisioningTokenGuard } from './guards/provisioning-token.guard.js'

@Module({
  controllers: [UserController, AccountsController, ProfilesController],
  providers: [
    { provide: IUserRepository, useClass: PrismaUserRepository },
    ProvisioningTokenGuard,
    GetUsersUseCase,
    GetUserSummaryUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ProvisionAccountUseCase,
    GetProfilesByIdsUseCase,
    SetAccountActiveUseCase,
    UpdateAccountProfileUseCase,
    LookupAccountUseCase,
    AssignAccountRoleUseCase,
  ],
  exports: [IUserRepository],
})
export class UserModule {}
