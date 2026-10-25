import { Injectable } from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'

export interface LabelledPair {
  subjectId: string
  subjectName: string | null
  gradeId: string
  gradeLevel: number | null
  gradeName: string | null
}

export interface QuestionScopeView {
  all: boolean
  employeeId: string | null
  pairs: LabelledPair[]
}

@Injectable()
export class GetQuestionScopeUseCase {
  constructor(
    private readonly scope: TeacherScope,
    private readonly academic: IAcademicLookupPort,
    private readonly employees: IEmployeeIdentityReadPort,
  ) {}

  async execute(user: ScopeUser): Promise<QuestionScopeView> {
    const scope = await this.scope.forUser(user)
    const employeeId = await this.employees.findEmployeeIdByUserId(user.id)
    if (scope.all) return { all: true, employeeId, pairs: [] }

    const grades = await this.academic.gradesByIds([
      ...new Set(scope.pairs.map((pair) => pair.gradeId)),
    ])
    return {
      all: false,
      employeeId,
      pairs: scope.pairs.map((pair) => {
        const grade = grades.find((candidate) => candidate.id === pair.gradeId)
        return {
          subjectId: pair.subjectId,
          subjectName: pair.subjectName ?? null,
          gradeId: pair.gradeId,
          gradeLevel: grade?.level ?? null,
          gradeName: grade?.name ?? null,
        }
      }),
    }
  }
}
