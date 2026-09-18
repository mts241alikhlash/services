import type { AdmissionWaveAcceptedCount } from '../../../wave/index.js'
import type {
  AdmissionApplicationEntity,
  AdmissionApplicationListRow,
  AdmissionStatusCount,
  ApplicationWithDocsAndPayment,
  ApplicationWithParentsAndUser,
  ApplicationWithWave,
  EnrollResult,
} from '../entities/admission-application.entity.js'
import type {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import type { AdmissionStatus } from '../../../../shared/domain/enums/admission-status.enum.js'
import type { AdmissionDocumentTypeRow } from '../../../document/index.js'

export type {
  AdmissionStatusCount,
  AdmissionWaveAcceptedCount,
  ApplicationWithDocsAndPayment,
  ApplicationWithParentsAndUser,
  ApplicationWithWave,
  EnrollResult,
}

export type { AdmissionDocumentTypeRow } from '../../../document/index.js'

export interface AdmissionApplicationQueryInput extends PaginationQueryInput {
  search?: string
  status?: AdmissionStatus
  waveId?: string
}

export interface CreateAdmissionApplicationRepositoryInput {
  userId: string
  waveId: string
  registrationNumber: string
  fullName: string
  status?: AdmissionStatus
  nickname?: string | null
  birthPlace?: string | null
  birthDate?: Date | null
  nik?: string | null
  nisn?: string | null
  religionId?: string | null
  phone?: string | null
  email?: string | null
}

export type UpdateAdmissionApplicationRepositoryInput =
  Partial<CreateAdmissionApplicationRepositoryInput>

export interface AcceptAdmissionApplicationInput {
  id: string
  adminId: string
  note: string | null
}

export interface RejectAdmissionApplicationInput {
  id: string
  adminId: string
  reason: string
}

export interface EnrollApplicantRepositoryInput {
  nis: string
  nisn: string
  gradeId: string
  classroomId?: string
}

export abstract class IAdmissionApplicationRepository {
  abstract findAll(
    query: AdmissionApplicationQueryInput,
  ): Promise<PaginatedResult<AdmissionApplicationListRow>>
  abstract findById(id: string): Promise<ApplicationWithParentsAndUser | null>
  abstract findActiveById(
    id: string,
  ): Promise<ApplicationWithParentsAndUser | null>
  abstract findByApplicantId(
    applicantId: string,
  ): Promise<ApplicationWithParentsAndUser | null>
  abstract create(
    input: CreateAdmissionApplicationRepositoryInput,
  ): Promise<AdmissionApplicationEntity>
  abstract update(
    id: string,
    input: UpdateAdmissionApplicationRepositoryInput,
  ): Promise<AdmissionApplicationEntity>
  abstract remove(id: string): Promise<AdmissionApplicationEntity>

  abstract setRevisionNeeded(
    id: string,
    note: string,
  ): Promise<ApplicationWithDocsAndPayment>
  abstract findActiveWithDocsAndPayment(
    id: string,
  ): Promise<ApplicationWithDocsAndPayment | null>
  abstract findRequiredActiveDocumentTypes(): Promise<
    AdmissionDocumentTypeRow[]
  >
  abstract setVerified(
    id: string,
    adminId: string,
  ): Promise<ApplicationWithDocsAndPayment>
  abstract findActiveWithWave(id: string): Promise<ApplicationWithWave | null>
  abstract countAcceptedInWave(waveId: string): Promise<number>
  abstract setAccepted(
    input: AcceptAdmissionApplicationInput,
  ): Promise<ApplicationWithDocsAndPayment>
  abstract findActiveWithParentsAndUser(
    id: string,
  ): Promise<ApplicationWithParentsAndUser | null>
  abstract setEnrolling(id: string): Promise<ApplicationWithDocsAndPayment>
  abstract markEnrolled(
    id: string,
    enrolledStudentId: string,
  ): Promise<ApplicationWithDocsAndPayment>
  abstract getStatusCounts(waveId?: string): Promise<AdmissionStatusCount[]>
  abstract getWavesWithAcceptedCount(
    waveId?: string,
  ): Promise<AdmissionWaveAcceptedCount[]>
  abstract findAdminDetailById(
    id: string,
  ): Promise<ApplicationWithParentsAndUser | null>
  abstract countByNik(nik: string, excludeId: string): Promise<number>
  abstract findActiveDocumentTypes(): Promise<AdmissionDocumentTypeRow[]>
  abstract setRejected(
    input: RejectAdmissionApplicationInput,
  ): Promise<ApplicationWithDocsAndPayment>
}
