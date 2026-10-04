import { ConflictException, Injectable } from '@nestjs/common'
import { CreateRoleInput } from './create-role.input.js'
import { IRoleRepository } from '../../../domain/repositories/role.repository.js'

@Injectable()
export class CreateRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(input: CreateRoleInput) {
    const existing = await this.roleRepository.findByCode(input.code)
    if (existing) throw new ConflictException('Role code already exists')
    return this.roleRepository.create({
      name: input.name,
      code: input.code,
      description: input.description,
      permissionIds: input.permissionIds,
    })
  }
}
