import { Injectable } from '@nestjs/common'
import { StorageService } from '../../../core/storage/storage.service.js'
import type { ProfileWithReferences } from '../../domain/repositories/profile.repository.js'

export type ProfileWithAvatarUrl = ProfileWithReferences & {
  avatarUrl: string | null
}

@Injectable()
export class ProfileAvatarUrlService {
  constructor(private readonly storage: StorageService) {}

  async attach(profile: ProfileWithReferences): Promise<ProfileWithAvatarUrl> {
    const key = profile.avatarFile?.storageKey
    const avatarUrl = key ? await this.storage.getSignedUrl(key) : null
    return { ...profile, avatarUrl }
  }
}
