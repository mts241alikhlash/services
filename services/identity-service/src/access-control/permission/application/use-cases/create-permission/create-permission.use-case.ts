import { ConflictException, Injectable } from '@nestjs/common'
import { CreatePermissionInput } from './create-permission.input.js'
import { IPermissionRepository } from '../../../domain/repositories/permission.repository.js'

@Injectable()
export class CreatePermissionUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(input: CreatePermissionInput) {
    const code = `${input.module}.${input.action}`

    const existing = await this.permissionRepository.findByCode(code)
    if (existing) {
      throw new ConflictException(`Permission "${code}" already exists`)
    }

    return this.permissionRepository.createPermission({
      module: input.module,
      action: input.action,
      code,
      description: input.description ?? '',
    })
  }
}
