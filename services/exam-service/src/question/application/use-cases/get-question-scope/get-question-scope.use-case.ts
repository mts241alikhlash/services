import { Injectable } from '@nestjs/common'
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
  pairs: LabelledPair[]
}

@Injectable()
export class GetQuestionScopeUseCase {
  constructor(
    private readonly scope: TeacherScope,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async execute(user: ScopeUser): Promise<QuestionScopeView> {
    const scope = await this.scope.forUser(user)
    if (scope.all) return { all: true, pairs: [] }

    const grades = await this.academic.gradesByIds([
      ...new Set(scope.pairs.map((pair) => pair.gradeId)),
    ])
    return {
      all: false,
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
