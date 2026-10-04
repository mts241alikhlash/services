import { Injectable } from '@nestjs/common'
import type { CreateAssetUnitSeedInput } from '../../../domain/repositories/asset.repository.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { CreateAssetInput } from './create-asset.input.js'

@Injectable()
export class CreateAssetUseCase {
  constructor(private readonly assetRepository: IAssetRepository) {}

  async execute(input: CreateAssetInput) {
    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1

    const category = await this.assetRepository.findCategoryById(
      input.categoryId,
    )
    const catCode = category ? category.code.toUpperCase() : 'GEN'
    const year = new Date(input.purchaseDate).getFullYear()
    const prefix = `AST-${catCode}/${year}/`

    const latestParent =
      await this.assetRepository.findLatestAssetByPrefix(prefix)
    let seq = 1
    if (latestParent) {
      const lastPart = latestParent.assetNumber.split('/').pop()
      seq = (parseInt(lastPart ?? '', 10) || 0) + 1
    }
    const assetNumber =
      input.assetNumber ?? `${prefix}${seq.toString().padStart(3, '0')}`

    const units: CreateAssetUnitSeedInput[] = Array.from(
      { length: quantity },
      (_, idx) => {
        const n = idx + 1
        const unitNumber = `${assetNumber}-${n.toString().padStart(2, '0')}`
        return {
          unitNumber,
          barcode:
            quantity === 1 && input.barcode && input.barcode.length > 0
              ? input.barcode
              : unitNumber,
          currentBookValue: input.purchasePrice,
          conditionId: input.conditionId,
          statusId: input.statusId,
          locationId: input.locationId,
        }
      },
    )

    return this.assetRepository.create({
      assetNumber,
      name: input.name,
      brand: input.brand ?? null,
      model: input.model ?? null,
      purchaseDate: new Date(input.purchaseDate),
      purchasePrice: input.purchasePrice,
      usefulLifeMonths: input.usefulLifeMonths ?? undefined,
      notes: input.notes ?? null,
      categoryId: input.categoryId,
      fundingSourceId: input.fundingSourceId ?? undefined,
      units,
    })
  }
}
