import type {
  EnrolmentQueueQuery,
  EnrolmentQueueResult,
  NisCandidateRow,
  Placement,
  PlacementState,
  ProcessState,
} from '../entities/enrolment.entity.js'

export abstract class IAdmissionEnrolmentRepository {
  abstract findQueue(query: EnrolmentQueueQuery): Promise<EnrolmentQueueResult>
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
  abstract findProcessState(applicationId: string): Promise<ProcessState | null>
}
