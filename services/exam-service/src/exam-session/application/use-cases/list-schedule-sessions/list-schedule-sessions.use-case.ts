import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamSession } from '../../../domain/entities/exam-session.entity.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

export interface ScheduleSessionRow extends ExamSession {
  studentName: string | null
  studentNis: string | null
}

@Injectable()
export class ListScheduleSessionsUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly students: IStudentDirectoryPort,
  ) {}

  async execute(
    scheduleId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<ScheduleSessionRow>> {
    if ((await this.schedules.findById(scheduleId)) === null) {
      throw new NotFoundException('Jadwal tidak ditemukan')
    }
    const result = await this.sessions.findPageBySchedule(
      scheduleId,
      page,
      limit,
    )
    const refs = new Map(
      (
        await this.students.refsByIds(result.data.map((row) => row.studentId))
      ).map((ref) => [ref.id, ref]),
    )
    return {
      ...result,
      data: result.data.map((row) => ({
        ...row,
        studentName: refs.get(row.studentId)?.name ?? null,
        studentNis: refs.get(row.studentId)?.nis ?? null,
      })),
    }
  }
}
