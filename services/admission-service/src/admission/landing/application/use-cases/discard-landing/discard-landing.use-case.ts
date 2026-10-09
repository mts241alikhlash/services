import { Injectable } from '@nestjs/common'
import { buildOverview } from '../../../domain/entities/landing.entity.js'
import { ILandingRepository } from '../../../domain/repositories/landing-repository.js'
import { LandingImageGarbageCollector } from '../../landing-image-garbage-collector.js'

@Injectable()
export class DiscardLandingUseCase {
  constructor(
    private readonly repository: ILandingRepository,
    private readonly collector: LandingImageGarbageCollector,
  ) {}

  async execute() {
    await this.repository.discardAll()
    await this.collector.run()
    return buildOverview(await this.repository.findAllSections())
  }
}
