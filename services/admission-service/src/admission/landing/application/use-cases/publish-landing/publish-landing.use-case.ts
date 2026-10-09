import { ConflictException, Injectable } from '@nestjs/common'
import { buildOverview } from '../../../domain/entities/landing.entity.js'
import { ILandingRepository } from '../../../domain/repositories/landing-repository.js'
import { LandingImageGarbageCollector } from '../../landing-image-garbage-collector.js'

@Injectable()
export class PublishLandingUseCase {
  constructor(
    private readonly repository: ILandingRepository,
    private readonly collector: LandingImageGarbageCollector,
  ) {}

  async execute(userId: string) {
    const published = await this.repository.publishAll(userId)
    if (published === 0) {
      throw new ConflictException('Tidak ada perubahan untuk diterbitkan')
    }
    await this.collector.run()
    return buildOverview(await this.repository.findAllSections())
  }
}
