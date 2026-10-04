import { Injectable, NotFoundException } from '@nestjs/common'
import { UpdatePermissionInput } from './update-permission.input.js'
import { IPermissionRepository } from '../../../domain/repositories/permission.repository.js'

@Injectable()
export class UpdatePermissionUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(id: string, input: UpdatePermissionInput) {
    const existing = await this.permissionRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Permission with ID ${id} not found`)
    }

    return this.permissionRepository.updatePermission(id, {
      description: input.description ?? '',
    })
  }
}
