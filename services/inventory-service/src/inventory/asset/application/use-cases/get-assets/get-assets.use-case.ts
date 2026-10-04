import { Injectable } from '@nestjs/common'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { GetAssetsInput } from './get-assets.input.js'

@Injectable()
export class GetAssetsUseCase {
  constructor(private readonly assetRepository: IAssetRepository) {}

  async execute(input: GetAssetsInput) {
    return this.assetRepository.findAll({
      page: input.page,
      limit: input.limit,
      keyword: input.keyword,
      categoryId: input.categoryId,
      locationId: input.locationId,
      statusId: input.statusId,
      conditionId: input.conditionId,
      fundingSourceId: input.fundingSourceId,
    })
  }
}
