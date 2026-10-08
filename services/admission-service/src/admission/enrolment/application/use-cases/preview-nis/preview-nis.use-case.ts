import { Injectable } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'
import { buildNisPlan } from '../../nis-plan.js'

@Injectable()
export class PreviewNisUseCase {
  constructor(
    private readonly enrolments: IAdmissionEnrolmentRepository,
    private readonly lookup: IReferenceLookupPort,
  ) {}

  async execute(academicYearId: string) {
    const { year, candidates, locked, plan } = await buildNisPlan(
      this.enrolments,
      this.lookup,
      academicYearId,
    )
    const byId = new Map(candidates.map((row) => [row.applicationId, row]))
    return {
      academicYearId,
      academicYearName: year.name,
      locked,
      changes: plan.changes,
      created: plan.created,
      rows: plan.assignments.map((assignment) => {
        const row = byId.get(assignment.applicationId)!
        return {
          applicationId: assignment.applicationId,
          applicantName: row.fullName,
          registrationNumber: row.registrationNumber,
          gradeLevel: row.gradeLevel!,
          previous: assignment.previous,
          nis: assignment.nis,
          changed:
            assignment.previous !== null &&
            assignment.previous !== assignment.nis,
        }
      }),
      skipped: plan.skipped.map((skipped) => {
        const row = byId.get(skipped.applicationId)!
        return {
          applicationId: skipped.applicationId,
          applicantName: row.fullName,
          registrationNumber: row.registrationNumber,
          reason: skipped.reason,
        }
      }),
    }
  }
}
