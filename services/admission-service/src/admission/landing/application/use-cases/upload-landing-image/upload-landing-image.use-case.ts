import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { LandingImageEntity } from '../../../domain/entities/landing.entity.js'
import { assertLandingImage } from '../../../domain/policies/landing-image-upload.policy.js'
import {
  ILandingImageProcessor,
  type LandingImagePurpose,
} from '../../../domain/repositories/landing-image-processor.port.js'
import { ILandingRepository } from '../../../domain/repositories/landing-repository.js'
import { ILandingStorage } from '../../../domain/repositories/landing-storage.port.js'

export interface UploadLandingImageInput {
  file: { buffer: Buffer } | undefined
  purpose: LandingImagePurpose
  userId: string
}

@Injectable()
export class UploadLandingImageUseCase {
  constructor(
    private readonly repository: ILandingRepository,
    private readonly processor: ILandingImageProcessor,
    private readonly storage: ILandingStorage,
  ) {}

  async execute(input: UploadLandingImageInput): Promise<LandingImageEntity> {
    const buffer = input.file?.buffer
    assertLandingImage(buffer)
    const processed = await this.processor.process(buffer!, input.purpose)
    const fileKey = `admission-landing/${randomUUID()}.webp`
    await this.storage.put(fileKey, processed.content)
    try {
      return await this.repository.createImage({
        fileKey,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.content.length,
        createdById: input.userId,
      })
    } catch (error) {
      await this.storage.remove(fileKey).catch(() => undefined)
      throw error
    }
  }
}
