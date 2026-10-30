import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { assertCanSchedule } from '../../../../exam-package/domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import type { NewParticipant } from '../../../domain/entities/schedule-participant.entity.js'
import {
  assertWindowNotPast,
  validateScheduleWindow,
} from '../../../domain/policies/validate-schedule-window.policy.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { MakeupParticipantsService } from '../../makeup-participants.service.js'

export interface CreateMakeupInput {
  packageId?: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  participants: NewParticipant[]
}

@Injectable()
export class CreateMakeupUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly participants: MakeupParticipantsService,
  ) {}

  async execute(
    user: { id: string },
    originalId: string,
    input: CreateMakeupInput,
    now: Date = new Date(),
  ): Promise<ExamSchedule> {
    const original = await this.schedules.findById(originalId)
    if (original === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (original.kind !== 'REGULAR') {
      throw new BadRequestException('Susulan hanya untuk jadwal utama')
    }
    if (original.status !== 'SCHEDULED') {
      throw new ConflictException('Jadwal ujian sudah dibatalkan')
    }

    validateScheduleWindow(input)
    assertWindowNotPast(input, now)
    if (input.startsAt.getTime() < original.endsAt.getTime()) {
      throw new BadRequestException(
        'Susulan harus dimulai setelah ujian utama berakhir',
      )
    }

    const packageId = input.packageId ?? original.packageId
    await this.assertPackage(original, packageId)
    await this.participants.assertEligible(original, input.participants, now)

    const created = await this.schedules.createMakeup({
      packageId,
      classroomId: original.classroomId,
      semesterId: original.semesterId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      durationMinutes: input.durationMinutes,
      type: original.type,
      createdById: user.id,
      makeupOfId: original.id,
      participants: input.participants,
    })
    if (created === null) throw new NotFoundException('Paket tidak ditemukan')
    return created
  }

  private async assertPackage(
    original: ExamSchedule,
    packageId: string,
  ): Promise<void> {
    const target = await this.packages.findById(packageId)
    if (target === null) throw new NotFoundException('Paket tidak ditemukan')
    assertCanSchedule(target.status)
    const source = await this.packages.findById(original.packageId)
    if (
      source !== null &&
      (source.subjectId !== target.subjectId ||
        source.gradeId !== target.gradeId)
    ) {
      throw new BadRequestException(
        'Paket susulan harus untuk mapel dan tingkat yang sama',
      )
    }
  }
}
