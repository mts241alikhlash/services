import { HttpException, Injectable } from '@nestjs/common'
import type { ScopeUser } from '../../teacher-scope.service.js'
import { ApproveQuestionUseCase } from '../approve-question/approve-question.use-case.js'

export interface ApprovalResult {
  id: string
  ok: boolean
  reason?: string
}

@Injectable()
export class ApproveManyQuestionsUseCase {
  constructor(private readonly approveQuestion: ApproveQuestionUseCase) {}

  async execute(user: ScopeUser, ids: string[]): Promise<ApprovalResult[]> {
    const results: ApprovalResult[] = []
    for (const id of new Set(ids)) {
      try {
        await this.approveQuestion.execute(user, id)
        results.push({ id, ok: true })
      } catch (error) {
        if (!(error instanceof HttpException)) throw error
        results.push({ id, ok: false, reason: error.message })
      }
    }
    return results
  }
}
