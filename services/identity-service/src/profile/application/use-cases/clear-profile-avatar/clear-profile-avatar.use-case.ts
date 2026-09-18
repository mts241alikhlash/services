import { Injectable } from '@nestjs/common'
import { IProfileRepository } from '../../../domain/repositories/profile.repository.js'
import { StorageService } from '../../../../core/storage/storage.service.js'

@Injectable()
export class ClearProfileAvatarUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly storage: StorageService,
  ) {}

  async execute(userId: string) {
    const { profile, replacedKey } =
      await this.profileRepository.clearAvatar(userId)

    if (replacedKey) {
      await this.storage.deleteFile(replacedKey).catch(() => undefined)
    }

    return profile
  }
}
