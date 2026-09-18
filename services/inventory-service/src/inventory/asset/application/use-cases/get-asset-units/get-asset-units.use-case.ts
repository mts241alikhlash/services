import { Injectable } from '@nestjs/common'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'
import { GetAssetUnitsInput } from './get-asset-units.input.js'

@Injectable()
export class GetAssetUnitsUseCase {
  constructor(private readonly assetUnitRepository: IAssetUnitRepository) {}

  async execute(input: GetAssetUnitsInput) {
    return this.assetUnitRepository.findAll({
      page: input.page,
      limit: input.limit,
      lendable: input.lendable,
      search: input.search,
    })
  }
}
