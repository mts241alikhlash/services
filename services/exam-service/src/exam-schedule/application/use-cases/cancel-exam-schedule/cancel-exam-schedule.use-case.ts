import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { CANCELLED_MESSAGE } from '../update-exam-schedule/update-exam-schedule.use-case.js'

@Injectable()
export class CancelExamScheduleUseCase {
  constructor(private readonly schedules: IExamScheduleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.schedules.findById(id)
    if (existing === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (!(await this.schedules.cancel(id))) {
      throw new ConflictException(CANCELLED_MESSAGE)
    }
  }
}
