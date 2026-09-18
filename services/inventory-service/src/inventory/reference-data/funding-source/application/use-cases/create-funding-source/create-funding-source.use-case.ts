import { Injectable } from '@nestjs/common'
import { IFundingSourceRepository } from '../../../domain/repositories/funding-source.repository.js'
import { CreateFundingSourceInput } from './create-funding-source.input.js'

@Injectable()
export class CreateFundingSourceUseCase {
  constructor(
    private readonly fundingSourceRepository: IFundingSourceRepository,
  ) {}

  async execute(input: CreateFundingSourceInput) {
    return this.fundingSourceRepository.create({
      code: input.code,
      name: input.name,
      description: input.description ?? null,
    })
  }
}
