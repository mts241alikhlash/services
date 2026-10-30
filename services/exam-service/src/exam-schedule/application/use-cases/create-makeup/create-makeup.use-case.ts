import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { assertCanSchedule } from '../../../../exam-package/domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import type { NewParticipant } from '../../../domain/entities/schedule-participant.entity.js'
import type { MakeupRefusal } from '../../../domain/policies/makeup-eligibility.policy.js'
import {
  assertWindowNotPast,
  validateScheduleWindow,
} from '../../../domain/policies/validate-schedule-window.policy.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import { MakeupCandidatesService } from '../../makeup-candidates.service.js'

export interface CreateMakeupInput {
  packageId?: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  participants: NewParticipant[]
}

export const REFUSAL_TEXT: Record<MakeupRefusal, string> = {
  ALREADY_SAT: 'sudah mengikuti ujian ini',
  IN_PROGRESS: 'sedang mengerjakan ujian ini',
  ON_LIVE_MAKEUP: 'sudah terdaftar di susulan lain',
}

export const MAX_PARTICIPANTS = 100

@Injectable()
export class CreateMakeupUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly candidates: MakeupCandidatesService,
    private readonly students: IStudentDirectoryPort,
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
    await this.assertParticipants(original, input.participants, now)

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

  private async assertParticipants(
    original: ExamSchedule,
    participants: NewParticipant[],
    now: Date,
  ): Promise<void> {
    if (participants.length === 0) {
      throw new BadRequestException('Pilih minimal satu siswa')
    }
    if (participants.length > MAX_PARTICIPANTS) {
      throw new BadRequestException(
        `Paling banyak ${MAX_PARTICIPANTS} siswa sekali susulan`,
      )
    }
    const studentIds = participants.map((participant) => participant.studentId)
    if (new Set(studentIds).size !== studentIds.length) {
      throw new BadRequestException('Siswa terdaftar dua kali')
    }
    if (
      participants.some((participant) => (participant.note ?? '').length > 200)
    ) {
      throw new BadRequestException('Catatan paling banyak 200 karakter')
    }

    const candidates = new Map(
      (await this.candidates.evaluate(original, now)).map((candidate) => [
        candidate.studentId,
        candidate,
      ]),
    )
    const refs = new Map(
      (await this.students.refsByIds(studentIds)).map((ref) => [ref.id, ref]),
    )
    for (const studentId of studentIds) {
      const candidate = candidates.get(studentId)
      if (candidate === undefined) {
        throw new BadRequestException('Siswa bukan bagian dari kelas ini')
      }
      if (!candidate.eligibility.eligible) {
        const ref = refs.get(studentId)
        const who = ref?.name ?? ref?.nis ?? 'Siswa'
        throw new BadRequestException(
          `${who} ${REFUSAL_TEXT[candidate.eligibility.reason]}`,
        )
      }
    }
  }
}
