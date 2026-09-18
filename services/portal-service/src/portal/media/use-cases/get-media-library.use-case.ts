import { Injectable } from '@nestjs/common'
import { StorageService } from '../../../core/storage/storage.service.js'
import { IFileRepository } from '../../../platform/file/domain/interfaces/file-repository.interface.js'
import { PUBLIC_MEDIA_PATH } from '../../post/constants/post.constants.js'

@Injectable()
export class GetMediaLibraryUseCase {
  constructor(
    private readonly fileRepository: IFileRepository,
    private readonly storage: StorageService,
  ) {}

  async execute() {
    const files = await this.fileRepository.findManyByAppKey('PORTAL')

    return Promise.all(
      files.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt: file.createdAt,
        previewUrl: await this.storage.getSignedUrl(file.storageKey),
        publicUrl: `${PUBLIC_MEDIA_PATH}/${file.id}`,
      })),
    )
  }
}
