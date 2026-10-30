import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { NewParticipant } from '../../../domain/entities/schedule-participant.entity.js'
import { assertWindowNotPast } from '../../../domain/policies/validate-schedule-window.policy.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import type { GradingUser } from '../../../../exam-grading/application/grading-scope.service.js'
import { MakeupScopeService } from '../../makeup-scope.service.js'
import { MakeupParticipantsService } from '../../makeup-participants.service.js'

@Injectable()
export class AddMakeupParticipantsUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly participants: MakeupParticipantsService,
    private readonly scope: MakeupScopeService,
  ) {}

  async execute(
    user: GradingUser,
    scheduleId: string,
    rows: NewParticipant[],
    now: Date = new Date(),
  ): Promise<void> {
    const makeup = await this.schedules.findById(scheduleId)
    if (makeup === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (makeup.kind !== 'MAKEUP' || makeup.makeupOfId === null) {
      throw new BadRequestException('Hanya jadwal susulan yang punya peserta')
    }
    await this.scope.assertAllowed(user, makeup)
    if (makeup.status !== 'SCHEDULED') {
      throw new ConflictException('Jadwal ujian sudah dibatalkan')
    }
    assertWindowNotPast(makeup, now)

    const original = await this.schedules.findById(makeup.makeupOfId)
    if (original === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (original.status !== 'SCHEDULED') {
      throw new ConflictException('Ujian utama sudah dibatalkan')
    }
    await this.participants.assertNotOnMakeup(scheduleId, rows)
    await this.participants.assertEligible(original, rows, now)
    await this.schedules.addParticipants(scheduleId, rows, user.id)
  }
}
