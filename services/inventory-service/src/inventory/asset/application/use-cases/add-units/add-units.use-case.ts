import { Injectable, NotFoundException } from '@nestjs/common'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'
import { CreateUnitsInput } from './add-units.input.js'

@Injectable()
export class AddUnitsUseCase {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly unitRepository: IAssetUnitRepository,
  ) {}

  async execute(assetId: string, input: CreateUnitsInput) {
    const asset = await this.assetRepository.findById(assetId)
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`)
    }
    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1

    const latest = await this.unitRepository.findLatestUnit(assetId)
    let start = 0
    if (latest) {
      const suffix = latest.unitNumber.split('-').pop()
      start = parseInt(suffix ?? '', 10) || 0
    }

    const rows = Array.from({ length: quantity }, (_, i) => {
      const n = start + i + 1
      const unitNumber = `${asset.assetNumber}-${n.toString().padStart(2, '0')}`
      return {
        assetId,
        unitNumber,
        barcode: unitNumber,
        currentBookValue: asset.purchasePrice,
        conditionId: input.conditionId,
        statusId: input.statusId,
        locationId: input.locationId,
      }
    })

    await this.unitRepository.createMany(rows)
    return this.unitRepository.findByAsset(assetId)
  }
}
