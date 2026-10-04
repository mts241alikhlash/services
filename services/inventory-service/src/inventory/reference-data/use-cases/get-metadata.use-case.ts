import { Injectable } from '@nestjs/common'
import { ICategoryRepository } from '../category/index.js'
import { ILocationRepository } from '../location/index.js'
import { IConditionRepository } from '../condition/index.js'
import { IStatusRepository } from '../status/index.js'
import { IFundingSourceRepository } from '../funding-source/index.js'

@Injectable()
export class GetMetadataUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly locationRepository: ILocationRepository,
    private readonly conditionRepository: IConditionRepository,
    private readonly statusRepository: IStatusRepository,
    private readonly fundingSourceRepository: IFundingSourceRepository,
  ) {}

  async execute() {
    const [categories, locations, conditions, statuses, fundingSources] =
      await Promise.all([
        this.categoryRepository.findMany(),
        this.locationRepository.findMany(),
        this.conditionRepository.findMany(),
        this.statusRepository.findMany(),
        this.fundingSourceRepository.findMany(),
      ])

    return {
      categories,
      locations,
      conditions,
      statuses,
      fundingSources,
    }
  }
}
