import { Injectable, NotFoundException } from '@nestjs/common'
import { IProfileRepository } from '../../../domain/repositories/profile.repository.js'

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId)
    if (!profile) {
      throw new NotFoundException(`Profile for user ID ${userId} not found`)
    }
    return profile
  }
}
