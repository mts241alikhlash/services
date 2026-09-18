import { Injectable, NotFoundException } from '@nestjs/common'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { UpdateAssetInput } from './update-asset.input.js'

@Injectable()
export class UpdateAssetUseCase {
  constructor(private readonly assetRepository: IAssetRepository) {}

  async execute(id: string, input: UpdateAssetInput) {
    const asset = await this.assetRepository.findById(id)
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`)
    }

    return this.assetRepository.update(id, {
      name: input.name,
      brand: input.brand ?? undefined,
      model: input.model ?? undefined,
      assetNumber: input.assetNumber,
      purchaseDate: input.purchaseDate
        ? new Date(input.purchaseDate)
        : undefined,
      purchasePrice: input.purchasePrice,
      usefulLifeMonths: input.usefulLifeMonths ?? undefined,
      notes: input.notes ?? undefined,
      categoryId: input.categoryId,
      fundingSourceId: input.fundingSourceId,
    })
  }
}
