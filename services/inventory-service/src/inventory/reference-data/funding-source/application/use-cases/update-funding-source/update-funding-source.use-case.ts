import { Injectable, NotFoundException } from '@nestjs/common'
import { IFundingSourceRepository } from '../../../domain/repositories/funding-source.repository.js'
import { UpdateFundingSourceInput } from './update-funding-source.input.js'

@Injectable()
export class UpdateFundingSourceUseCase {
  constructor(
    private readonly fundingSourceRepository: IFundingSourceRepository,
  ) {}

  async execute(id: string, input: UpdateFundingSourceInput) {
    const fundingSource = await this.fundingSourceRepository.findById(id)
    if (!fundingSource) {
      throw new NotFoundException(`Funding Source with ID ${id} not found`)
    }
    return this.fundingSourceRepository.update(id, {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
    })
  }
}
