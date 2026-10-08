import type { AcademicYearRef } from '../../../../shared/domain/entities/index.js'
import { AdmissionPaymentStatus } from '../../../../shared/domain/enums/admission-payment-status.enum.js'
import { AdmissionStatus } from '../../../../shared/domain/enums/admission-status.enum.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import type { AdmissionApplicationParentEntity } from './admission-application-parent.entity.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { AdmissionFileRef } from '../../../document/index.js'
import type {
  AdmissionDocumentRow,
  AdmissionDocumentWithTypeAndFile,
} from '../../../document/index.js'
import type { AdmissionPaymentWithProof } from '../../../payment/index.js'
import type { ActiveWaveRow, AdmissionWaveEntity } from '../../../wave/index.js'

export interface ReligionRef {
  id: string
  name: string
}

export interface AdmissionUserRef {
  id: string
  identifier: string
  lastLoginAt?: Date | null
}

export interface AdmissionApplicationEntity {
  id: string
  applicantId?: string
  waveId: string
  status: `${AdmissionStatus}`
  submittedAt?: Date | null
  deletedAt?: Date | null
  userId?: string
  registrationNumber?: string
  fullName?: string
  nickname?: string | null
  gender?: 'MALE' | 'FEMALE' | null
  birthPlace?: string | null
  birthDate?: Date | null
  nik?: string | null
  nisn?: string | null
  admissionType?: 'NEW' | 'TRANSFER' | null
  targetGradeId?: string | null
  targetGradeLevel?: number | null
  nis?: string | null
  religionId?: string | null
  phone?: string | null
  email?: string | null
  childOrder?: number | null
  siblingCount?: number | null
  street?: string | null
  rt?: string | null
  rw?: string | null
  village?: string | null
  district?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  previousSchoolName?: string | null
  previousSchoolNpsn?: string | null
  previousSchoolAddress?: string | null
  graduationYear?: number | null
  revisionNote?: string | null
  verifiedById?: string | null
  verifiedAt?: Date | null
  decidedById?: string | null
  decidedAt?: Date | null
  decisionNote?: string | null
  enrolledStudentId?: string | null
  enrolledAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export interface AdmissionAchievementRow {
  id: string
  sortOrder: number
  year: number
  competitionName: string
  competitionFieldId: string | null
  organizer: string | null
  competitionLevelId: string | null
  rank: string | null
  fileId: string | null
  file?: AdmissionFileRef | null
}

export interface AdmissionScholarshipRow {
  id: string
  sortOrder: number
  year: number
  categoryId: string | null
  scholarshipName: string
  providerName: string | null
  providerTypeId: string | null
  duration: string | null
  kipNumber?: string | null
  amount: DecimalValue | null
  fileId: string | null
  file?: AdmissionFileRef | null
}

export interface AdmissionApplicationFormFields {
  provinceCode?: string | null
  regencyCode?: string | null
  districtCode?: string | null
  villageCode?: string | null
  hobby?: string | null
  aspiration?: string | null
  financingSourceId?: string | null
  disabilityTypeId?: string | null
  specialNeedId?: string | null
  studentResidenceId?: string | null
  travelDistanceId?: string | null
  travelTimeId?: string | null
  transportationId?: string | null
  achievements?: AdmissionAchievementRow[]
  scholarships?: AdmissionScholarshipRow[]
}

export interface AdmissionStatusCount {
  status: string
  count: number
}

export interface AdmissionStatsFilter {
  waveId?: string
  academicYearId?: string
}

export interface ApplicationWithDocsAndPayment
  extends AdmissionApplicationEntity, AdmissionApplicationFormFields {
  documents?: AdmissionDocumentRow[]
  payment?: AdmissionPaymentWithProof | null
  wave?: AdmissionWaveEntity
  parents?: (AdmissionApplicationParentEntity & {
    occupation: { id: string; name: string } | null
    education: { id: string; name: string } | null
  })[]
}

export interface ApplicationWithParentsAndUser
  extends AdmissionApplicationEntity, AdmissionApplicationFormFields {
  userId: string
  fullName?: string
  nickname?: string | null
  nik?: string | null
  gender?: `${UserGender}` | null
  birthPlace?: string | null
  birthDate?: Date | null
  nisn?: string | null
  email?: string | null
  phone?: string | null
  religionId?: string | null
  religion?: ReligionRef | null
  registrationNumber?: string
  childOrder?: number | null
  siblingCount?: number | null
  previousSchoolName?: string | null
  previousSchoolNpsn?: string | null
  previousSchoolAddress?: string | null
  graduationYear?: number | null
  revisionNote?: string | null
  user?: AdmissionUserRef
  wave?: AdmissionWaveEntity & { academicYear?: AcademicYearRef | null }
  documents?: AdmissionDocumentWithTypeAndFile[]
  payment?: AdmissionPaymentWithProof | null
  parents?: (AdmissionApplicationParentEntity & {
    occupation: { id: string; name: string } | null
    education: { id: string; name: string } | null
  })[]
  street?: string | null
  rt?: string | null
  rw?: string | null
  village?: string | null
  district?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
}

export interface ApplicationWithWave extends AdmissionApplicationEntity {
  wave: AdmissionWaveEntity
}

export interface AdmissionApplicationListRow extends AdmissionApplicationEntity {
  registrationNumber: string
  fullName: string
  email: string | null
  wave?: { id: string; name: string; code: string }
  payment?: { status: `${AdmissionPaymentStatus}` } | null
  _count?: { documents: number }
}

export interface EnrolledStudentRef {
  id: string
  userId: string
  nis: string
  nisn: string
  gradeId: string | null
}

export interface EnrollResult {
  application: AdmissionApplicationEntity
  student: EnrolledStudentRef
  parentsLinked: number
  enrollmentCreated: boolean
}
