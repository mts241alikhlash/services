import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { QuestionDetail } from '../../../domain/entities/question.entity.js'
import { assertCanReturn } from '../../../domain/policies/review-transitions.policy.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import type { ScopeUser } from '../../teacher-scope.service.js'

const MAX_NOTE_LENGTH = 1000

@Injectable()
export class ReturnQuestionUseCase {
  constructor(private readonly questions: IQuestionRepository) {}

  async execute(
    user: ScopeUser,
    id: string,
    note: string,
    revision: number,
  ): Promise<QuestionDetail> {
    const trimmed = note.trim()
    if (trimmed === '') {
      throw new BadRequestException('Catatan pengembalian wajib diisi')
    }
    if (trimmed.length > MAX_NOTE_LENGTH) {
      throw new BadRequestException(
        `Catatan pengembalian paling banyak ${MAX_NOTE_LENGTH} karakter`,
      )
    }

    const question = await this.questions.findById(id)
    if (!question) throw new NotFoundException('Soal tidak ditemukan')
    assertCanReturn(question.status)

    const returned = await this.questions.applyReview(id, {
      expectedVersion: question.currentVersion,
      expectedRevision: revision,
      from: ['SUBMITTED'],
      to: 'RETURNED',
      action: 'RETURNED',
      note: trimmed,
      byUserId: user.id,
    })
    if (!returned) {
      throw new ConflictException('Status soal sudah berubah, muat ulang')
    }
    return returned
  }
}
