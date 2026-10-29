import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { resolveAuthor } from '../../../../question/application/resolve-author.js'
import {
  TeacherScope,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import {
  assertCanTakeFrom,
  assertEditable,
} from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { buildQuestionCopies } from '../../build-question-copies.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class TakePackageQuestionsUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly employees: IEmployeeIdentityReadPort,
  ) {}

  async execute(
    user: ScopeUser,
    targetId: string,
    sourceId: string,
    questionIds: string[],
  ): Promise<ExamPackageDetail> {
    if (questionIds.length === 0) {
      throw new BadRequestException('Pilih minimal satu soal')
    }
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException('Soal yang sama dipilih dua kali')
    }

    const [target, source] = await Promise.all([
      this.packages.findById(targetId),
      this.packages.findById(sourceId),
    ])
    if (target === null || source === null) {
      throw new NotFoundException('Paket tidak ditemukan')
    }

    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, target.subjectId, target.gradeId)
    if (
      source.subjectId !== target.subjectId ||
      source.gradeId !== target.gradeId
    ) {
      throw new BadRequestException(
        'Paket asal harus memiliki mapel dan tingkat yang sama dengan paket ini',
      )
    }
    assertCanTakeFrom(source.status)
    const next = assertEditable(target.status)

    const authorEmployeeId = await resolveAuthor(
      this.employees,
      user,
      scope.all,
      undefined,
    )
    const copies = await buildQuestionCopies(
      this.questions,
      source,
      questionIds,
      target,
      authorEmployeeId,
      user.id,
    )

    const updated = await this.packages.addQuestions(
      targetId,
      { expected: target.status, next },
      copies,
    )
    if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return updated
  }
}
