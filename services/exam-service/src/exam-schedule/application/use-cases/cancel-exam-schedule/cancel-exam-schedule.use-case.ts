import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { IScheduleSessionGuard } from '../../../domain/ports/schedule-session-guard.port.js'
import { CANCELLED_MESSAGE } from '../update-exam-schedule/update-exam-schedule.use-case.js'

const HAS_SESSIONS_MESSAGE = 'Jadwal sudah punya sesi dan tidak bisa dibatalkan'

@Injectable()
export class CancelExamScheduleUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly guard: IScheduleSessionGuard,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.schedules.findById(id)
    if (existing === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (await this.guard.hasSessions(id))
      throw new ConflictException(HAS_SESSIONS_MESSAGE)
    if (!(await this.schedules.cancel(id))) {
      throw new ConflictException(
        (await this.guard.hasSessions(id))
          ? HAS_SESSIONS_MESSAGE
          : CANCELLED_MESSAGE,
      )
    }
  }
}
