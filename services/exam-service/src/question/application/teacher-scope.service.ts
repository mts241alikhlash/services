import { ForbiddenException, Injectable } from '@nestjs/common'
import type { Question } from '../domain/entities/question.entity.js'
import {
  IAcademicLookupPort,
  type TeachingPair,
} from '../../platform/academic-lookup/academic-lookup.port.js'
import { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'

const MANAGE_ALL = 'exam-questions.manage-all'

export interface ScopeUser {
  id: string
  roles: string[]
  permissions: string[]
}

export type TeacherScopeResult =
  { all: true } | { all: false; pairs: TeachingPair[] }

@Injectable()
export class TeacherScope {
  constructor(
    private readonly employees: IEmployeeIdentityReadPort,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async forUser(user: ScopeUser): Promise<TeacherScopeResult> {
    if (user.permissions.includes(MANAGE_ALL)) return { all: true }

    const employeeId = await this.employees.findEmployeeIdByUserId(user.id)
    if (employeeId === null) return { all: false, pairs: [] }

    return {
      all: false,
      pairs: await this.academic.teachingPairsOf(employeeId),
    }
  }

  assertCovers(
    scope: TeacherScopeResult,
    subjectId: string,
    gradeId: string,
  ): void {
    if (scope.all) return
    const covered = scope.pairs.some(
      (pair) => pair.subjectId === subjectId && pair.gradeId === gradeId,
    )
    if (!covered) {
      throw new ForbiddenException('Mapel dan tingkat ini bukan ampuan Anda')
    }
  }

  async employeeIdOf(user: ScopeUser): Promise<string> {
    const employeeId = await this.employees.findEmployeeIdByUserId(user.id)
    if (employeeId === null) {
      throw new ForbiddenException('Akun Anda belum terhubung ke data pegawai')
    }
    return employeeId
  }

  async assertCanModify(
    user: ScopeUser,
    question: Pick<Question, 'subjectId' | 'gradeId' | 'authorEmployeeId'>,
  ): Promise<void> {
    const scope = await this.forUser(user)
    if (scope.all) return
    this.assertCovers(scope, question.subjectId, question.gradeId)
    if ((await this.employeeIdOf(user)) !== question.authorEmployeeId) {
      throw new ForbiddenException('Soal ini ditulis guru lain')
    }
  }
}
