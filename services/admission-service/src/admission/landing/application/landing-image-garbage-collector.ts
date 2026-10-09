import { Injectable, Logger } from '@nestjs/common'
import { findUnusedImages } from '../domain/policies/landing-unused-images.policy.js'
import { ILandingRepository } from '../domain/repositories/landing-repository.js'
import { ILandingStorage } from '../domain/repositories/landing-storage.port.js'

@Injectable()
export class LandingImageGarbageCollector {
  private readonly logger = new Logger(LandingImageGarbageCollector.name)

  constructor(
    private readonly repository: ILandingRepository,
    private readonly storage: ILandingStorage,
  ) {}

  async run(now = new Date()) {
    const [sections, images] = await Promise.all([
      this.repository.findAllSections(),
      this.repository.findAllImages(),
    ])
    const documents = sections.flatMap((section) => [
      section.published,
      section.draft,
    ])
    const unused = findUnusedImages(images, documents, now)
    if (unused.length === 0) return
    const removed = await this.repository.deleteImages(unused)
    for (const image of removed) {
      try {
        await this.storage.remove(image.fileKey)
      } catch (error) {
        this.logger.warn(
          `Could not remove ${image.fileKey}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }
}
