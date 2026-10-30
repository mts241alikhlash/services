import { BadRequestException, Injectable } from '@nestjs/common'
import { IStudentDirectoryPort } from '../../platform/student-directory/student-directory.port.js'
import type { ExamSchedule } from '../domain/entities/exam-schedule.entity.js'
import type { NewParticipant } from '../domain/entities/schedule-participant.entity.js'
import type { MakeupRefusal } from '../domain/policies/makeup-eligibility.policy.js'
import { MakeupCandidatesService } from './makeup-candidates.service.js'

export const REFUSAL_TEXT: Record<MakeupRefusal, string> = {
  ALREADY_SAT: 'sudah mengikuti ujian ini',
  IN_PROGRESS: 'sedang mengerjakan ujian ini',
  ON_LIVE_MAKEUP: 'sudah terdaftar di susulan lain',
}

export const MAX_PARTICIPANTS = 100

@Injectable()
export class MakeupParticipantsService {
  constructor(
    private readonly candidates: MakeupCandidatesService,
    private readonly students: IStudentDirectoryPort,
  ) {}

  async assertEligible(
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
