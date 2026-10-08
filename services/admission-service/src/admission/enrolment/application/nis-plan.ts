import { BadRequestException, ConflictException } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../platform/reference-lookup/reference-lookup.port.js'
import {
  NisPolicyError,
  planNis,
  schoolYearCode,
} from '../domain/policies/nis-number.policy.js'
import { IAdmissionEnrolmentRepository } from '../domain/repositories/admission-enrolment.repository.js'

export async function buildNisPlan(
  enrolments: IAdmissionEnrolmentRepository,
  lookup: IReferenceLookupPort,
  academicYearId: string,
) {
  const [year] = await lookup.listAcademicYears([academicYearId])
  if (!year) throw new BadRequestException('Tahun ajaran tidak ditemukan')
  const [candidates, locked] = await Promise.all([
    enrolments.findNisCandidates(academicYearId),
    enrolments.isNisLocked(academicYearId),
  ])
  try {
    const plan = planNis({
      candidates: candidates.map((row) => ({
        applicationId: row.applicationId,
        fullName: row.fullName,
        registrationNumber: row.registrationNumber,
        gradeLevel: row.gradeLevel,
        currentNis: row.currentNis,
      })),
      yearCode: schoolYearCode(year.name),
      locked,
    })
    return { year, candidates, locked, plan }
  } catch (error) {
    if (error instanceof NisPolicyError) {
      throw new ConflictException(error.message)
    }
    throw error
  }
}
