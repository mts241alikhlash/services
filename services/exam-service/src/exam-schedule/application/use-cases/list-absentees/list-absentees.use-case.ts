import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import type { Eligibility } from '../../../domain/policies/makeup-eligibility.policy.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'
import type { GradingUser } from '../../../../exam-grading/application/grading-scope.service.js'
import { MakeupScopeService } from '../../makeup-scope.service.js'
import { MakeupCandidatesService } from '../../makeup-candidates.service.js'

export interface AbsenteeRow {
  studentId: string
  name: string | null
  nis: string | null
  eligibility: Eligibility
}

@Injectable()
export class ListAbsenteesUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly candidates: MakeupCandidatesService,
    private readonly students: IStudentDirectoryPort,
    private readonly scope: MakeupScopeService,
  ) {}

  async execute(
    user: GradingUser,
    scheduleId: string,
    now: Date = new Date(),
  ): Promise<AbsenteeRow[]> {
    const original = await this.schedules.findById(scheduleId)
    if (original === null) throw new NotFoundException('Jadwal tidak ditemukan')
    if (original.kind !== 'REGULAR') {
      throw new BadRequestException('Susulan hanya untuk jadwal utama')
    }
    await this.scope.assertAllowed(user, original)
    const candidates = await this.candidates.evaluate(original, now)
    const refs = await this.students.refsByIds(
      candidates.map((candidate) => candidate.studentId),
    )
    const refOf = new Map(refs.map((ref) => [ref.id, ref]))
    return candidates
      .map((candidate) => ({
        studentId: candidate.studentId,
        name: refOf.get(candidate.studentId)?.name ?? null,
        nis: refOf.get(candidate.studentId)?.nis ?? null,
        eligibility: candidate.eligibility,
      }))
      .sort((a, b) =>
        (a.name ?? a.nis ?? '').localeCompare(b.name ?? b.nis ?? '', 'id'),
      )
  }
}
