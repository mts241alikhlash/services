import type {
  EnrollmentQueueQuery,
  EnrollmentQueueResult,
  NisCandidateRow,
  Placement,
  PlacementState,
  ProcessState,
} from '../entities/enrollment.entity.js'

export abstract class IAdmissionEnrollmentRepository {
  abstract findQueue(
    query: EnrollmentQueueQuery,
  ): Promise<EnrollmentQueueResult>
  abstract findNisCandidates(academicYearId: string): Promise<NisCandidateRow[]>
  abstract writeNis(
    changes: { applicationId: string; nis: string | null }[],
  ): Promise<void>
  abstract isNisLocked(academicYearId: string): Promise<boolean>
  abstract lockNis(
    academicYearId: string,
    lockedById: string,
  ): Promise<{ lockedAt: Date } | null>
  abstract findPlacementState(
    applicationId: string,
  ): Promise<PlacementState | null>
  abstract setPlacement(
    applicationId: string,
    placement: Placement,
    clearNis: boolean,
  ): Promise<void>
  abstract setNisn(applicationId: string, nisn: string): Promise<void>
  abstract findProcessState(applicationId: string): Promise<ProcessState | null>
}
