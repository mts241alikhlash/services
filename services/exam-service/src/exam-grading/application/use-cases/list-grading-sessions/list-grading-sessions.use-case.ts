import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import type {
  ExamSession,
  ExamSessionStatus,
} from '../../../../exam-session/domain/entities/exam-session.entity.js'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  GradingScopeService,
  type GradingUser,
} from '../../grading-scope.service.js'

export interface GradingSessionRow {
  sessionId: string
  studentId: string
  studentName: string | null
  studentNis: string | null
  status: ExamSession['status']
  submittedAt: Date | null
  rawScore: number | null
  maxScore: number | null
  awaitingGrading: boolean
  violationCount: number
  publication: 'PENDING' | 'SENT' | null
}

@Injectable()
export class ListGradingSessionsUseCase {
  constructor(
    private readonly scope: GradingScopeService,
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly students: IStudentDirectoryPort,
  ) {}

  async execute(
    user: GradingUser,
    scheduleId: string,
    query: { page: number; limit: number; status?: ExamSessionStatus },
  ): Promise<PaginatedResult<GradingSessionRow>> {
    const schedule = await this.schedules.findById(scheduleId)
    const scope = await this.scope.forUser(user)
    if (
      schedule === null ||
      !(await scope.allows(
        schedule.subjectId,
        schedule.classroomId,
        schedule.semesterId,
      ))
    ) {
      throw new NotFoundException('Jadwal tidak ditemukan')
    }

    const page = await this.sessions.findPageBySchedule(
      scheduleId,
      query.page,
      query.limit,
      query.status,
    )
    const [refs, publications] = await Promise.all([
      this.students.refsByIds(page.data.map((row) => row.studentId)),
      this.sessions.publicationStatuses(page.data.map((row) => row.id)),
    ])
    const refOf = new Map(refs.map((ref) => [ref.id, ref]))

    return {
      ...page,
      data: page.data.map((row) => ({
        sessionId: row.id,
        studentId: row.studentId,
        studentName: refOf.get(row.studentId)?.name ?? null,
        studentNis: refOf.get(row.studentId)?.nis ?? null,
        status: row.status,
        submittedAt: row.submittedAt,
        rawScore: row.rawScore,
        maxScore: row.maxScore,
        awaitingGrading: row.status === 'SUBMITTED' || row.status === 'EXPIRED',
        violationCount: row.violationCount,
        publication: publications.get(row.id) ?? null,
      })),
    }
  }
}
