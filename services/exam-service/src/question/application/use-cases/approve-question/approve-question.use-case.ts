import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { QuestionDetail } from '../../../domain/entities/question.entity.js'
import { assertCanApprove } from '../../../domain/policies/review-transitions.policy.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import type { ScopeUser } from '../../teacher-scope.service.js'

@Injectable()
export class ApproveQuestionUseCase {
  constructor(private readonly questions: IQuestionRepository) {}

  async execute(user: ScopeUser, id: string): Promise<QuestionDetail> {
    const question = await this.questions.findById(id)
    if (!question) throw new NotFoundException('Soal tidak ditemukan')
    assertCanApprove(question.status)

    const approved = await this.questions.applyReview(id, {
      expectedVersion: question.currentVersion,
      from: ['SUBMITTED'],
      to: 'APPROVED',
      action: 'APPROVED',
      note: null,
      byUserId: user.id,
    })
    if (!approved) {
      throw new ConflictException('Status soal sudah berubah, muat ulang')
    }
    return approved
  }
}
