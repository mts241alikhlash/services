import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { IStudentEnrolmentPort } from '../../../../application/index.js'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'
import { buildNisPlan } from '../../nis-plan.js'

interface ComposeNisInput {
  academicYearId: string
  expectedChanges: number
  syncStudents?: boolean
  bearerToken: string
}

const STUDENT_FAILURE = 'Gagal memperbarui NIS di data santri'

@Injectable()
export class ComposeNisUseCase {
  private readonly logger = new Logger(ComposeNisUseCase.name)

  constructor(
    private readonly enrolments: IAdmissionEnrolmentRepository,
    private readonly lookup: IReferenceLookupPort,
    private readonly students: IStudentEnrolmentPort,
  ) {}

  async execute(input: ComposeNisInput) {
    const { candidates, plan } = await buildNisPlan(
      this.enrolments,
      this.lookup,
      input.academicYearId,
    )
    if (plan.changes !== input.expectedChanges) {
      throw new ConflictException(
        'Hasil susun NIS berubah, lihat pratinjau lagi',
      )
    }

    const heldChanges = plan.assignments.some(
      (assignment) =>
        assignment.previous !== null &&
        assignment.previous !== assignment.nis &&
        candidates.find(
          (candidate) => candidate.applicationId === assignment.applicationId,
        )?.status === 'ENROLLING',
    )
    if (heldChanges) {
      throw new ConflictException(
        'Ada pendaftar Tertahan yang NIS-nya akan berubah, selesaikan dulu',
      )
    }

    const toWrite = plan.assignments.filter(
      (assignment) => assignment.previous !== assignment.nis,
    )
    await this.enrolments.writeNis(
      toWrite.map(({ applicationId, nis }) => ({ applicationId, nis })),
    )

    const changedIds = new Set(
      toWrite.map((assignment) => assignment.applicationId),
    )
    const assigned = new Map(
      plan.assignments.map((assignment) => [
        assignment.applicationId,
        assignment.nis,
      ]),
    )
    const targets = candidates.flatMap((row) => {
      const nis = assigned.get(row.applicationId) ?? row.currentNis
      return row.status === 'ENROLLED' &&
        row.studentId &&
        nis &&
        (input.syncStudents || changedIds.has(row.applicationId))
        ? [{ applicationId: row.applicationId, nis, studentId: row.studentId }]
        : []
    })

    const failed = new Map<string, string>()
    for (const target of targets) {
      try {
        await this.students.updateNis(
          target.studentId,
          `T${target.studentId.replace(/-/g, '').slice(0, 18)}`,
          input.bearerToken,
        )
      } catch (error) {
        this.logger.error(
          `Parking the NIS of ${target.studentId} failed: ${String(error)}`,
        )
        failed.set(target.applicationId, STUDENT_FAILURE)
      }
    }
    for (const target of targets) {
      try {
        await this.students.updateNis(
          target.studentId,
          target.nis,
          input.bearerToken,
        )
      } catch (error) {
        this.logger.error(
          `Setting the NIS of ${target.studentId} failed: ${String(error)}`,
        )
        failed.set(target.applicationId, STUDENT_FAILURE)
      }
    }

    return {
      academicYearId: input.academicYearId,
      written: toWrite.length,
      created: plan.created,
      changed: plan.changes,
      failed: [...failed].map(([applicationId, reason]) => ({
        applicationId,
        reason,
      })),
    }
  }
}
