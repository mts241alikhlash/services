import { Injectable } from '@nestjs/common'
import {
  EffectiveAssignment,
  ISalaryAssignmentRepository,
} from '../../assignment/domain/interfaces/salary-assignment-repository.interface.js'

export interface ResolvedSalary {
  userId: string
  assignments: EffectiveAssignment[]
}

export function periodEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0))
}

@Injectable()
export class SalaryResolverService {
  constructor(private readonly assignments: ISalaryAssignmentRepository) {}

  async resolve(
    userIds: string[],
    year: number,
    month: number,
  ): Promise<Map<string, EffectiveAssignment[]>> {
    const effective = await this.assignments.findEffectiveOn(
      userIds,
      periodEnd(year, month),
    )

    const byUser = new Map<string, EffectiveAssignment[]>(
      userIds.map((userId) => [userId, []]),
    )

    for (const assignment of effective) {
      byUser.get(assignment.userId)?.push(assignment)
    }

    return byUser
  }

  unconfigured(byUser: Map<string, EffectiveAssignment[]>): string[] {
    return [...byUser.entries()]
      .filter(([, assignments]) => assignments.length === 0)
      .map(([userId]) => userId)
  }
}
