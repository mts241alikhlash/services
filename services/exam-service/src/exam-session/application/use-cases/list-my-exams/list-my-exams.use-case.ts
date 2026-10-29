import { Injectable } from '@nestjs/common'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import type { ExamType } from '../../../../exam-schedule/domain/entities/exam-schedule.entity.js'
import type { MyExamStatus } from '../../../domain/entities/exam-session.entity.js'
import { myExamStatus } from '../../../domain/policies/my-exam-status.policy.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

export interface MyExam {
  id: string
  title: string
  subjectId: string
  subjectName: string | null
  type: ExamType
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  status: MyExamStatus
  sessionId: string | null
}

const RANK: Record<MyExamStatus, number> = {
  IN_PROGRESS: 0,
  OPEN: 1,
  UPCOMING: 2,
  FINISHED: 3,
}

@Injectable()
export class ListMyExamsUseCase {
  constructor(
    private readonly students: IStudentIdentityReadPort,
    private readonly enrollments: IEnrollmentLookupPort,
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async execute(
    user: { id: string },
    now: Date = new Date(),
  ): Promise<MyExam[]> {
    const studentId = await this.students.findStudentIdByUserId(user.id)
    if (studentId === null) return []
    const enrollment = await this.enrollments.findActiveByStudent(studentId)
    if (enrollment === null) return []

    const schedules = await this.schedules.findForClassroom(
      enrollment.classroomId,
      enrollment.semesterId,
    )
    if (schedules.length === 0) return []

    const sessions = await this.sessions.listByStudentAndSchedules(
      studentId,
      schedules.map((schedule) => schedule.id),
    )
    const sessionOf = new Map(sessions.map((s) => [s.scheduleId, s]))

    const rows: MyExam[] = []
    for (const schedule of schedules) {
      const pkg = await this.packages.findById(schedule.packageId)
      if (pkg === null) continue
      const session = sessionOf.get(schedule.id) ?? null
      rows.push({
        id: schedule.id,
        title: schedule.packageTitle,
        subjectId: pkg.subjectId,
        subjectName: null,
        type: schedule.type,
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        durationMinutes: schedule.durationMinutes,
        status: myExamStatus(schedule, session, now),
        sessionId: session?.id ?? null,
      })
    }
    const names = await this.subjectNames(rows.map((row) => row.subjectId))
    for (const row of rows) row.subjectName = names.get(row.subjectId) ?? null

    return rows.sort(
      (a, b) =>
        RANK[a.status] - RANK[b.status] ||
        (a.status === 'FINISHED'
          ? b.endsAt.getTime() - a.endsAt.getTime()
          : a.startsAt.getTime() - b.startsAt.getTime()),
    )
  }

  private async subjectNames(ids: string[]): Promise<Map<string, string>> {
    try {
      const subjects = await this.academic.subjectsByIds([...new Set(ids)])
      return new Map(subjects.map((subject) => [subject.id, subject.name]))
    } catch {
      return new Map()
    }
  }
}
