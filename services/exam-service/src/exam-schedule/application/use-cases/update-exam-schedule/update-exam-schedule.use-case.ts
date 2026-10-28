import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import { IScheduleSessionGuard } from '../../../domain/ports/schedule-session-guard.port.js'
import { validateScheduleWindow } from '../../../domain/policies/validate-schedule-window.policy.js'
import {
  IExamScheduleRepository,
  type ScheduleWindowFields,
} from '../../../domain/repositories/exam-schedule.repository.js'

export const CANCELLED_MESSAGE = 'Jadwal sudah dibatalkan'
export const EXTEND_ONLY_MESSAGE =
  'Jadwal sudah punya sesi: hanya waktu selesai yang bisa diperpanjang'

@Injectable()
export class UpdateExamScheduleUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly guard: IScheduleSessionGuard,
  ) {}

  async execute(
    id: string,
    fields: ScheduleWindowFields,
  ): Promise<ExamSchedule> {
    const existing = await this.schedules.findById(id)
    if (existing === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (existing.status !== 'SCHEDULED') {
      throw new ConflictException(CANCELLED_MESSAGE)
    }

    if (await this.guard.hasSessions(id)) {
      const unchanged =
        fields.startsAt.getTime() === existing.startsAt.getTime() &&
        fields.durationMinutes === existing.durationMinutes &&
        fields.endsAt.getTime() >= existing.endsAt.getTime()
      if (!unchanged) throw new ConflictException(EXTEND_ONLY_MESSAGE)
    }

    validateScheduleWindow(fields)
    const updated = await this.schedules.updateWindow(id, fields)
    if (updated === null) {
      throw new ConflictException(
        (await this.guard.hasSessions(id))
          ? EXTEND_ONLY_MESSAGE
          : CANCELLED_MESSAGE,
      )
    }
    return updated
  }
}
