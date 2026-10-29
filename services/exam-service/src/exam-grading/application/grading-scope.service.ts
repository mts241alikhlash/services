import { Injectable } from '@nestjs/common'
import {
  IAcademicLookupPort,
  type TeachingAssignmentRef,
} from '../../platform/academic-lookup/academic-lookup.port.js'
import { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'

const MANAGE_ALL = 'exam-grading.manage-all'

export interface GradingUser {
  id: string
  roles: string[]
  permissions: string[]
}

export interface GradingScope {
  all: boolean
  pairsFor(semesterId: string): Promise<TeachingAssignmentRef[]>
  allows(
    subjectId: string,
    classroomId: string,
    semesterId: string,
  ): Promise<boolean>
}

@Injectable()
export class GradingScopeService {
  constructor(
    private readonly employees: IEmployeeIdentityReadPort,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async forUser(user: GradingUser): Promise<GradingScope> {
    if (user.permissions.includes(MANAGE_ALL)) {
      return {
        all: true,
        pairsFor: () => Promise.resolve([]),
        allows: () => Promise.resolve(true),
      }
    }

    const employeeId = await this.employees.findEmployeeIdByUserId(user.id)
    const cache = new Map<string, Promise<TeachingAssignmentRef[]>>()
    const pairsFor = (semesterId: string): Promise<TeachingAssignmentRef[]> => {
      if (employeeId === null) return Promise.resolve([])
      let pairs = cache.get(semesterId)
      if (pairs === undefined) {
        pairs = this.academic.teachingAssignmentsOf(employeeId, semesterId)
        cache.set(semesterId, pairs)
      }
      return pairs
    }

    return {
      all: false,
      pairsFor,
      allows: async (subjectId, classroomId, semesterId) =>
        (await pairsFor(semesterId)).some(
          (pair) =>
            pair.subjectId === subjectId && pair.classroomId === classroomId,
        ),
    }
  }
}
