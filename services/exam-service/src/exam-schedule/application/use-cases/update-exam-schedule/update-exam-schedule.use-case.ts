import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import { validateScheduleWindow } from '../../../domain/policies/validate-schedule-window.policy.js'
import {
  IExamScheduleRepository,
  type ScheduleWindowFields,
} from '../../../domain/repositories/exam-schedule.repository.js'

export const CANCELLED_MESSAGE = 'Jadwal sudah dibatalkan'

@Injectable()
export class UpdateExamScheduleUseCase {
  constructor(private readonly schedules: IExamScheduleRepository) {}

  async execute(
    id: string,
    fields: ScheduleWindowFields,
  ): Promise<ExamSchedule> {
    const existing = await this.schedules.findById(id)
    if (existing === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (existing.status !== 'SCHEDULED') {
      throw new ConflictException(CANCELLED_MESSAGE)
    }

    validateScheduleWindow(fields)
    const updated = await this.schedules.updateWindow(id, fields)
    if (updated === null) throw new ConflictException(CANCELLED_MESSAGE)
    return updated
  }
}
