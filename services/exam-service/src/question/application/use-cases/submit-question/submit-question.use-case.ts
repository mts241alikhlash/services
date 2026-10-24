import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { QuestionDetail } from '../../../domain/entities/question.entity.js'
import { assertCanSubmit } from '../../../domain/policies/review-transitions.policy.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'

@Injectable()
export class SubmitQuestionUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(user: ScopeUser, id: string): Promise<QuestionDetail> {
    const question = await this.questions.findById(id)
    if (!question) throw new NotFoundException('Soal tidak ditemukan')
    await this.scope.assertCanModify(user, question)
    assertCanSubmit(question.status)

    const submitted = await this.questions.applyReview(id, {
      from: ['DRAFT', 'RETURNED'],
      to: 'SUBMITTED',
      action: 'SUBMITTED',
      note: null,
      byUserId: user.id,
    })
    if (!submitted) {
      throw new ConflictException('Status soal sudah berubah, muat ulang')
    }
    return submitted
  }
}
