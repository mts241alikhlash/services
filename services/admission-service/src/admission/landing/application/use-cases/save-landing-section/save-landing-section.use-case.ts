import { BadRequestException, Injectable } from '@nestjs/common'
import { buildOverview } from '../../../domain/entities/landing.entity.js'
import {
  collectImageIds,
  parseLandingSection,
} from '../../../domain/policies/landing-content.schema.js'
import { ILandingRepository } from '../../../domain/repositories/landing-repository.js'
import { LandingImageGarbageCollector } from '../../landing-image-garbage-collector.js'

@Injectable()
export class SaveLandingSectionUseCase {
  constructor(
    private readonly repository: ILandingRepository,
    private readonly collector: LandingImageGarbageCollector,
  ) {}

  async execute(key: string, content: unknown, userId: string) {
    const document = parseLandingSection(key, content)
    const ids = collectImageIds(document)
    if (ids.length > 0) {
      const found = await this.repository.findImagesByIds(ids)
      if (found.length !== ids.length) {
        throw new BadRequestException('Gambar tidak ditemukan')
      }
    }
    await this.repository.saveDraft(key, document, userId)
    await this.collector.run()
    return buildOverview(await this.repository.findAllSections())
  }
}
