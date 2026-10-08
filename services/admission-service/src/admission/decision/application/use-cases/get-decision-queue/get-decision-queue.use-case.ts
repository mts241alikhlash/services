import { Injectable } from '@nestjs/common'
import { summarizeDocuments } from '../../../../document-review/index.js'
import type { DecisionTab } from '../../../domain/entities/decision.entity.js'
import { IAdmissionDecisionRepository } from '../../../domain/repositories/admission-decision.repository.js'

interface GetDecisionQueueInput {
  tab?: DecisionTab
  search?: string
  waveId?: string
  page?: number
  limit?: number
}

@Injectable()
export class GetDecisionQueueUseCase {
  constructor(private readonly decisions: IAdmissionDecisionRepository) {}

  async execute(input: GetDecisionQueueInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const { records, total, counts, requiredTypeIds } =
      await this.decisions.findQueue({
        tab: input.tab ?? 'waiting',
        search: input.search,
        waveId: input.waveId,
        page,
        limit,
      })
    return {
      data: records.map(({ documents, ...record }) => ({
        ...record,
        summary: summarizeDocuments(requiredTypeIds, documents),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        counts,
      },
    }
  }
}
