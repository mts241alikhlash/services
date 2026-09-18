import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class AssignAccountRoleUseCase {
  private readonly logger = new Logger(AssignAccountRoleUseCase.name)

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, roleCode: string): Promise<void> {
    const exists = await this.userRepository.existsById(userId)
    if (!exists) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    await this.userRepository.assignRole(userId, roleCode)
    this.logger.log(`Role ${roleCode} assigned to account ${userId}`)
  }
}
