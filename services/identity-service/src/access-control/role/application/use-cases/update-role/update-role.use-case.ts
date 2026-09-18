import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UpdateRoleInput } from './update-role.input.js'
import { IRoleRepository } from '../../../domain/repositories/role.repository.js'

@Injectable()
export class UpdateRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(id: string, input: UpdateRoleInput) {
    const role = await this.roleRepository.findById(id)
    if (!role) throw new NotFoundException('Role not found')
    if (role.code === 'SUPER_ADMIN') {
      throw new ForbiddenException('The SUPER_ADMIN role cannot be modified')
    }
    return this.roleRepository.update(id, {
      name: input.name,
      description: input.description,
      permissionIds: input.permissionIds,
    })
  }
}
