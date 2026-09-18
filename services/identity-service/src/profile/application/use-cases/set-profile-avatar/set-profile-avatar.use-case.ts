import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { IProfileRepository } from '../../../domain/repositories/profile.repository.js'
import { StorageService } from '../../../../core/storage/storage.service.js'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

const MAX_BYTES = 2 * 1024 * 1024

@Injectable()
export class SetProfileAvatarUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly storage: StorageService,
  ) {}

  async execute(
    userId: string,
    file: {
      buffer: Buffer
      originalname: string
      mimetype: string
      size: number
    },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file was uploaded')
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `Avatar must be one of ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      )
    }
    if (file.size > MAX_BYTES) {
      throw new PayloadTooLargeException('Avatar must be 2 MB or smaller')
    }

    const filename = `${randomUUID()}${extname(file.originalname) || ''}`
    const storageKey = `profiles/avatars/${userId}/${filename}`

    await this.storage.uploadFile(file.buffer, storageKey, file.mimetype)

    const { profile, replacedKey } = await this.profileRepository.setAvatar(
      userId,
      {
        uploadedBy: userId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
      },
    )

    if (replacedKey && replacedKey !== storageKey) {
      await this.storage.deleteFile(replacedKey).catch(() => undefined)
    }

    return profile
  }
}
