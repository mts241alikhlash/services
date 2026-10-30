import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'

@Injectable()
export class RemoveMakeupParticipantUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
  ) {}

  async execute(scheduleId: string, studentId: string): Promise<void> {
    const makeup = await this.schedules.findById(scheduleId)
    if (makeup?.kind !== 'MAKEUP') {
      throw new NotFoundException('Jadwal susulan tidak ditemukan')
    }
    const participants = await this.schedules.listParticipants(scheduleId)
    if (!participants.some((row) => row.studentId === studentId)) {
      throw new NotFoundException('Siswa bukan peserta susulan ini')
    }
    const [session] = await this.sessions.listByStudentAndSchedules(studentId, [
      scheduleId,
    ])
    if (session !== undefined) {
      throw new ConflictException('Siswa sudah punya sesi, tidak bisa dihapus')
    }
    if (participants.length === 1) {
      throw new ConflictException(
        'Susulan harus punya minimal satu siswa, batalkan jadwalnya',
      )
    }
    await this.schedules.removeParticipant(scheduleId, studentId)
  }
}
