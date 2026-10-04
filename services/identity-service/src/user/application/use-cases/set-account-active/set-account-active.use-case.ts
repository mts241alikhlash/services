import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class SetAccountActiveUseCase {
  private readonly logger = new Logger(SetAccountActiveUseCase.name)

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, isActive: boolean) {
    const exists = await this.userRepository.existsById(userId)
    if (!exists) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const user = await this.userRepository.update(userId, { isActive })
    this.logger.log(`Account ${userId} set to isActive=${String(isActive)}`)
    return user
  }
}
