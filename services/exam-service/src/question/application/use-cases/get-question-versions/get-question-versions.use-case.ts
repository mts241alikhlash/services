import { Injectable, NotFoundException } from '@nestjs/common'
import type { QuestionVersion } from '../../../domain/entities/question.entity.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'

@Injectable()
export class GetQuestionVersionsUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(user: ScopeUser, id: string): Promise<QuestionVersion[]> {
    const question = await this.questions.findById(id)
    if (!question) throw new NotFoundException('Soal tidak ditemukan')

    this.scope.assertCovers(
      await this.scope.forUser(user),
      question.subjectId,
      question.gradeId,
    )
    return this.questions.findVersions(id)
  }
}
