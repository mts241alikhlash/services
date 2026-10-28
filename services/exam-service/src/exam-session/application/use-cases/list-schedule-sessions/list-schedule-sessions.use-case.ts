import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamSession } from '../../../domain/entities/exam-session.entity.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

@Injectable()
export class ListScheduleSessionsUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
  ) {}

  async execute(
    scheduleId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<ExamSession>> {
    if ((await this.schedules.findById(scheduleId)) === null) {
      throw new NotFoundException('Jadwal tidak ditemukan')
    }
    return this.sessions.findPageBySchedule(scheduleId, page, limit)
  }
}
