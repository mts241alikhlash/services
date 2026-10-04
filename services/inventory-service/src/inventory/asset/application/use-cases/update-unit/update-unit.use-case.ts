import { Injectable, NotFoundException } from '@nestjs/common'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'
import { UpdateUnitInput } from './update-unit.input.js'

@Injectable()
export class UpdateUnitUseCase {
  constructor(private readonly unitRepository: IAssetUnitRepository) {}

  async execute(id: string, input: UpdateUnitInput) {
    const unit = await this.unitRepository.findById(id)
    if (!unit) {
      throw new NotFoundException(`Asset unit with ID ${id} not found`)
    }
    return this.unitRepository.update(id, {
      barcode: input.barcode ?? undefined,
      notes: input.notes ?? undefined,
      custodianId: input.custodianId ?? undefined,
      conditionId: input.conditionId,
      statusId: input.statusId,
      locationId: input.locationId,
    })
  }
}
