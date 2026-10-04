import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IRoleRepository } from '../../../domain/repositories/role.repository.js'
import { isStructuralRole } from '../../../domain/policies/structural-roles.policy.js'

@Injectable()
export class DeleteRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(id: string) {
    const role = await this.roleRepository.findById(id)
    if (!role) throw new NotFoundException('Role not found')

    if (role.isSystem || isStructuralRole(role.code)) {
      throw new ForbiddenException(
        `The ${role.code} role cannot be deleted: the application resolves it by name and stops working without it.`,
      )
    }

    return this.roleRepository.delete(id)
  }
}
