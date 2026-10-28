import { Injectable, Logger } from '@nestjs/common'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamScore } from '../../../domain/entities/exam-score.entity.js'
import { IExamScoreRepository } from '../../../domain/repositories/exam-score.repository.js'

const READ_ALL = 'exam-scores.read-all'

export interface ExamScoreReader {
  id: string
  roles: string[]
  permissions: string[]
}

export interface ExamScoreRow extends ExamScore {
  classroomName: string | null
}

@Injectable()
export class ListExamScoresUseCase {
  private readonly logger = new Logger(ListExamScoresUseCase.name)

  constructor(
    private readonly scores: IExamScoreRepository,
    private readonly employees: IEmployeeIdentityReadPort,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async execute(
    user: ExamScoreReader,
    query: {
      page: number
      limit: number
      semesterId?: string
      classroomId?: string
      subjectId?: string
    },
  ): Promise<PaginatedResult<ExamScoreRow>> {
    const all = user.permissions.includes(READ_ALL)
    let semesterId = query.semesterId
    let pairs: { subjectId: string; classroomId: string }[] | null = null

    if (!all) {
      semesterId ??= (await this.academic.findActiveSemester())?.id
      const employeeId = await this.employees.findEmployeeIdByUserId(user.id)
      pairs =
        employeeId === null || semesterId === undefined
          ? []
          : (
              await this.academic.listTeachingAssignmentsByEmployee(
                employeeId,
                semesterId,
              )
            ).map((row) => ({
              subjectId: row.subjectId,
              classroomId: row.classroomId,
            }))
    }

    const page = await this.scores.findPage({
      page: query.page,
      limit: query.limit,
      semesterId,
      classroomId: query.classroomId,
      subjectId: query.subjectId,
      pairs,
    })

    const names = await this.classroomNames(
      page.data.map((row) => row.classroomId),
    )
    return {
      ...page,
      data: page.data.map((row) => ({
        ...row,
        classroomName: names.get(row.classroomId) ?? null,
      })),
    }
  }

  private async classroomNames(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    try {
      const rooms = await this.academic.listClassrooms([...new Set(ids)])
      return new Map(
        rooms.map((room) => [room.id, room.name ?? room.code ?? '']),
      )
    } catch (error) {
      this.logger.warn(`Classroom names unavailable: ${String(error)}`)
      return new Map()
    }
  }
}
