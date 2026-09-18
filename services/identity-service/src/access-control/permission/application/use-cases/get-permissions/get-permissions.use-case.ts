import { Injectable } from '@nestjs/common'
import { IPermissionRepository } from '../../../domain/repositories/permission.repository.js'
import { appForModule } from '../../../domain/policies/permission-apps.policy.js'

@Injectable()
export class GetPermissionsUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute() {
    const permissions = await this.permissionRepository.findAll()
    return permissions.map((permission) => ({
      ...permission,
      app: appForModule(permission.module),
    }))
  }
}
