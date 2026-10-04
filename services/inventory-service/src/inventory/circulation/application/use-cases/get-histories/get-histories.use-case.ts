import { Injectable } from '@nestjs/common'
import { IHistoryRepository } from '../../../domain/repositories/history.repository.js'
import { GetHistoriesInput } from './get-histories.input.js'

@Injectable()
export class GetHistoriesUseCase {
  constructor(private readonly historyRepository: IHistoryRepository) {}

  async execute(input: GetHistoriesInput) {
    return this.historyRepository.findAllHistories({
      page: input.page,
      limit: input.limit,
      unitId: input.unitId,
    })
  }
}
