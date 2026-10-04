import { Injectable, NotFoundException } from '@nestjs/common'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'

@Injectable()
export class DeleteAssetUseCase {
  constructor(private readonly assetRepository: IAssetRepository) {}

  async execute(id: string) {
    const asset = await this.assetRepository.findById(id)
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`)
    }
    await this.assetRepository.softDelete(id)
  }
}
