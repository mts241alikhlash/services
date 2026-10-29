import {
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
import { assertCanTakeFrom } from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { MAX_TITLE_LENGTH } from '../../build-package-items.js'
import { buildQuestionCopies } from '../../build-question-copies.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class CopyExamPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly employees: IEmployeeIdentityReadPort,
  ) {}

  async execute(user: ScopeUser, id: string): Promise<ExamPackageDetail> {
    const source = await this.packages.findById(id)
    if (source === null) throw new NotFoundException('Paket tidak ditemukan')

    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, source.subjectId, source.gradeId)
    assertCanTakeFrom(source.status)

    const draft = await this.packages.create({
      title: `Salinan ${source.title}`.slice(0, MAX_TITLE_LENGTH),
      subjectId: source.subjectId,
      gradeId: source.gradeId,
      createdById: user.id,
      items: [],
    })
    const authorEmployeeId = await resolveAuthor(
      this.employees,
      user,
      scope.all,
      undefined,
    )
    const copies = await buildQuestionCopies(
      this.questions,
      source,
      source.items.map((item) => item.questionId),
      draft,
      authorEmployeeId,
      user.id,
    )
    const filled = await this.packages.addQuestions(
      draft.id,
      { expected: 'DRAFT', next: 'DRAFT' },
      copies,
    )
    if (filled === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return filled
  }
}
