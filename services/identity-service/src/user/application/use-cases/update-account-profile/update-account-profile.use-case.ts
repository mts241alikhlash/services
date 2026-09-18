import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { UpdateAccountProfileInput } from './update-account-profile.input.js'
import {
  IUserRepository,
  UpdateProfileRepositoryInput,
} from '../../../domain/repositories/user.repository.js'

@Injectable()
export class UpdateAccountProfileUseCase {
  private readonly logger = new Logger(UpdateAccountProfileUseCase.name)

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, input: UpdateAccountProfileInput) {
    const exists = await this.userRepository.existsById(userId)
    if (!exists) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const { birthDate, ...rest } = input
    const data: UpdateProfileRepositoryInput = {
      ...rest,
      ...(birthDate && { birthDate: new Date(birthDate) }),
    }

    const profile = await this.userRepository.updateProfile(userId, data)
    this.logger.log(`Profile updated for account ${userId}`)
    return profile
  }
}
