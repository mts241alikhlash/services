import { Injectable } from '@nestjs/common'
import {
  buildOverview,
  publishedSections,
} from '../../../domain/entities/landing.entity.js'
import { ILandingRepository } from '../../../domain/repositories/landing-repository.js'

@Injectable()
export class GetLandingUseCase {
  constructor(private readonly repository: ILandingRepository) {}

  async published() {
    return publishedSections(await this.repository.findAllSections())
  }

  async draft() {
    return buildOverview(await this.repository.findAllSections())
  }
}
