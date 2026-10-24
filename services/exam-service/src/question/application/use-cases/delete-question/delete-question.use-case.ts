import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'

@Injectable()
export class DeleteQuestionUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(user: ScopeUser, id: string): Promise<void> {
    const question = await this.questions.findById(id)
    if (!question) throw new NotFoundException('Soal tidak ditemukan')
    await this.scope.assertCanModify(user, question)

    if (question.approvedVersion !== null) {
      throw new ConflictException(
        'Soal yang pernah disetujui tidak bisa dihapus',
      )
    }
    const deleted = await this.questions.softDeleteNeverApproved(id)
    if (!deleted) {
      throw new ConflictException(
        'Soal yang pernah disetujui tidak bisa dihapus',
      )
    }
  }
}
