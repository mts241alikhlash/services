import { Injectable, Logger } from '@nestjs/common'
import { IRoleRepository } from '../../../domain/repositories/role.repository.js'
import { STRUCTURAL_ROLES } from '../../../domain/policies/structural-roles.policy.js'

@Injectable()
export class EnsureStructuralRolesUseCase {
  private readonly logger = new Logger(EnsureStructuralRolesUseCase.name)

  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(): Promise<void> {
    const created: string[] = []
    const protectedNow: string[] = []

    for (const role of STRUCTURAL_ROLES) {
      const existing = await this.roleRepository.findByCode(role.code)

      if (!existing) {
        await this.roleRepository.createStructural({
          code: role.code,
          name: role.name,
          description: role.description,
        })
        created.push(role.code)
        continue
      }

      if (!existing.isSystem) {
        await this.roleRepository.markSystem(existing.id)
        protectedNow.push(role.code)
      }
    }

    if (created.length > 0) {
      this.logger.log(
        `Created structural roles with no permissions — grant them on the role screen: ${created.join(', ')}`,
      )
    }
    if (protectedNow.length > 0) {
      this.logger.log(
        `Marked structural roles as protected: ${protectedNow.join(', ')}`,
      )
    }
  }
}
