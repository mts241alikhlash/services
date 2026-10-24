import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { QuestionDetail } from '../../../domain/entities/question.entity.js'
import { nextVersionAction } from '../../../domain/policies/next-version.policy.js'
import { assertValidPoints } from '../../../domain/policies/validate-points.policy.js'
import { prepareQuestion } from '../../../domain/policies/prepare-question.policy.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'
import type { UpdateQuestionInput } from './update-question.input.js'

@Injectable()
export class UpdateQuestionUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    id: string,
    input: UpdateQuestionInput,
  ): Promise<QuestionDetail> {
    if (
      input.bodyHtml === undefined &&
      input.content === undefined &&
      input.points === undefined
    ) {
      throw new BadRequestException('Tidak ada yang diubah')
    }
    if (input.points !== undefined) assertValidPoints(input.points)

    const question = await this.questions.findById(id)
    if (!question) throw new NotFoundException('Soal tidak ditemukan')
    await this.scope.assertCanModify(user, question)

    const { bodyHtml, content } = prepareQuestion(
      question.type,
      input.bodyHtml ?? question.current.bodyHtml,
      input.content ?? question.current.content,
    )
    const fields = {
      bodyHtml,
      content,
      points: input.points ?? question.current.points,
    }

    const expected = {
      status: question.status,
      currentVersion: question.currentVersion,
    }
    const updated =
      nextVersionAction(question.status) === 'new-version'
        ? await this.questions.addVersion(id, fields, user.id, expected)
        : await this.questions.editCurrentVersion(
            id,
            fields,
            question.status === 'SUBMITTED' ? 'DRAFT' : question.status,
            expected,
          )
    if (!updated) {
      throw new ConflictException('Status soal sudah berubah, muat ulang')
    }
    return updated
  }
}
