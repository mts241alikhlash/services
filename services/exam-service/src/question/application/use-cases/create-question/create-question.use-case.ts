import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import type { QuestionDetail } from '../../../domain/entities/question.entity.js'
import { assertValidPoints } from '../../../domain/policies/validate-points.policy.js'
import { prepareQuestion } from '../../../domain/policies/prepare-question.policy.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'
import type { CreateQuestionInput } from './create-question.input.js'

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly employees: IEmployeeIdentityReadPort,
  ) {}

  async execute(
    user: ScopeUser,
    input: CreateQuestionInput,
  ): Promise<QuestionDetail> {
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, input.subjectId, input.gradeId)
    assertValidPoints(input.points)

    const authorEmployeeId = await this.resolveAuthor(
      user,
      scope.all,
      input.authorEmployeeId,
    )
    const { bodyHtml, content } = prepareQuestion(
      input.type,
      input.bodyHtml,
      input.content,
    )

    return this.questions.create({
      packageId: input.packageId,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      authorEmployeeId,
      type: input.type,
      createdById: user.id,
      bodyHtml,
      content,
      points: input.points,
    })
  }

  private async resolveAuthor(
    user: ScopeUser,
    manageAll: boolean,
    requested: string | undefined,
  ): Promise<string> {
    const own = await this.employees.findEmployeeIdByUserId(user.id)

    if (!manageAll) {
      if (own === null) {
        throw new ForbiddenException(
          'Akun Anda belum terhubung ke data pegawai',
        )
      }
      if (requested !== undefined && requested !== own) {
        throw new ForbiddenException(
          'Hanya pengelola yang bisa memilih penulis soal',
        )
      }
      return own
    }

    if (requested !== undefined) {
      if (!(await this.employees.employeeExists(requested))) {
        throw new BadRequestException('Penulis soal tidak ditemukan')
      }
      return requested
    }
    if (own === null) throw new BadRequestException('Pilih guru penulis soal')
    return own
  }
}
