import { Injectable, NotFoundException } from '@nestjs/common'
import { StorageService } from '../../../core/storage/storage.service.js'
import { IFileRepository } from '../../../platform/file/domain/interfaces/file-repository.interface.js'
import { sharePreviewKey } from '../../../platform/file/constants/file-upload.constants.js'
import { PREVIEW_VARIANT } from '../../homepage/constants/meta.constants.js'
import { IMediaUsageRepository } from '../domain/interfaces/media-usage-repository.interface.js'

@Injectable()
export class GetPublicMediaUseCase {
  constructor(
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly fileRepository: IFileRepository,
    private readonly storage: StorageService,
  ) {}

  async execute(fileId: string, variant?: string): Promise<string> {
    const authorized =
      await this.mediaUsageRepository.isPubliclyReferenced(fileId)

    if (!authorized) {
      throw new NotFoundException('Document not found')
    }

    const file = await this.fileRepository.findById(fileId)
    if (!file) {
      throw new NotFoundException('Document not found')
    }

    const key =
      variant === PREVIEW_VARIANT
        ? sharePreviewKey(file.storageKey)
        : file.storageKey

    return this.storage.getSignedUrl(key)
  }
}
