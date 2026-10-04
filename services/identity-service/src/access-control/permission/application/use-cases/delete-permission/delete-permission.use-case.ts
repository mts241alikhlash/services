import { Injectable, NotFoundException } from '@nestjs/common'
import { IPermissionRepository } from '../../../domain/repositories/permission.repository.js'

@Injectable()
export class DeletePermissionUseCase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(id: string) {
    const existing = await this.permissionRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Permission with ID ${id} not found`)
    }

    await this.permissionRepository.deletePermission(id)
  }
}
