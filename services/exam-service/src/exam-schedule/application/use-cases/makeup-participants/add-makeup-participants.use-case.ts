import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { NewParticipant } from '../../../domain/entities/schedule-participant.entity.js'
import { assertWindowNotPast } from '../../../domain/policies/validate-schedule-window.policy.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { MakeupParticipantsService } from '../../makeup-participants.service.js'

@Injectable()
export class AddMakeupParticipantsUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly participants: MakeupParticipantsService,
  ) {}

  async execute(
    user: { id: string },
    scheduleId: string,
    rows: NewParticipant[],
    now: Date = new Date(),
  ): Promise<void> {
    const makeup = await this.schedules.findById(scheduleId)
    if (makeup === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (makeup.kind !== 'MAKEUP' || makeup.makeupOfId === null) {
      throw new BadRequestException('Hanya jadwal susulan yang punya peserta')
    }
    if (makeup.status !== 'SCHEDULED') {
      throw new ConflictException('Jadwal ujian sudah dibatalkan')
    }
    assertWindowNotPast(makeup, now)

    const original = await this.schedules.findById(makeup.makeupOfId)
    if (original === null) throw new NotFoundException('Jadwal tidak ditemukan')
    await this.participants.assertEligible(original, rows, now)
    await this.schedules.addParticipants(scheduleId, rows, user.id)
  }
}
