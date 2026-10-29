import { Injectable, NotFoundException } from '@nestjs/common'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { ExamScheduleView } from '../../../domain/entities/exam-schedule.entity.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { IScheduleSessionGuard } from '../../../domain/ports/schedule-session-guard.port.js'
import { withClassroomNames } from '../../with-classroom-names.js'

@Injectable()
export class GetExamScheduleUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly academic: IAcademicLookupPort,
    private readonly guard: IScheduleSessionGuard,
  ) {}

  async execute(id: string): Promise<ExamScheduleView> {
    const found = await this.schedules.findById(id)
    if (found === null) throw new NotFoundException('Jadwal tidak ditemukan')
    const [view] = await withClassroomNames(this.academic, [found])
    return { ...view, hasSessions: await this.guard.hasSessions(id) }
  }
}
