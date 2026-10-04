import type { AdmissionApplicantEntity } from '../entities/admission-applicant.entity.js'
import type { ActiveWaveRow, AdmissionWaveEntity } from '../../../wave/index.js'
import type {
  ApplicationWithDocsAndPayment,
  ApplicationWithParentsAndUser,
} from '../../../application/index.js'
import type { AdmissionAnnouncementWithWave } from '../../../announcement/index.js'
import type { AdmissionDocumentTypeRow } from '../../../document/index.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { AdmissionNotificationEntity } from '../../../notification/index.js'
import type { AdmissionNotificationType } from '../../../../shared/domain/enums/admission-notification-type.enum.js'
import type { ParentRelation } from '../../../../shared/domain/enums/parent-relation.enum.js'
import type { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export type { ActiveWaveRow, AdmissionDocumentTypeRow }

export interface AdmissionApplicationParentInput {
  relation: ParentRelation
  name: string
  nik?: string | null
  birthPlace?: string | null
  birthDate?: Date | null
  phone?: string | null
  occupationId?: string | null
  educationId?: string | null
  incomeRangeId?: string | null
  lifeStatusId?: string | null
  domicileId?: string | null
  residenceId?: string | null
  sameAddressAsStudent?: boolean
  street?: string | null
  rt?: string | null
  rw?: string | null
  village?: string | null
  district?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  provinceCode?: string | null
  regencyCode?: string | null
  districtCode?: string | null
  villageCode?: string | null
  isPrimary?: boolean
}

export interface AdmissionAchievementInput {
  year: number
  competitionName: string
  competitionFieldId?: string | null
  organizer?: string | null
  competitionLevelId?: string | null
  rank?: string | null
  fileId?: string | null
}

export interface AdmissionScholarshipInput {
  year: number
  categoryId?: string | null
  scholarshipName: string
  providerName?: string | null
  providerTypeId?: string | null
  duration?: string | null
  kipNumber?: string | null
  amount?: number | null
  fileId?: string | null
}

export interface RegisterApplicantWaveInput {
  id: string
  code: string
  registrationFee: DecimalValue
}

export interface RegisterApplicantInput {
  wave: RegisterApplicantWaveInput
  identifier: string
  passwordHash: string
  fullName: string
  phone?: string | null
}

export interface EnsureApplicationInput {
  userId: string
  waveId: string
  waveCode: string
  registrationFee: DecimalValue
}

export interface UpdateMyApplicationFields {
  fullName?: string
  nickname?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: Date
  nik?: string
  nisn?: string
  religionId?: string
  phone?: string
  childOrder?: number
  siblingCount?: number
  street?: string
  rt?: string
  rw?: string
  village?: string | null
  district?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string
  provinceCode?: string | null
  regencyCode?: string | null
  districtCode?: string | null
  villageCode?: string | null
  hobby?: string
  aspiration?: string
  financingSourceId?: string
  disabilityTypeId?: string
  specialNeedId?: string
  studentResidenceId?: string
  travelDistanceId?: string
  travelTimeId?: string
  transportationId?: string
  previousSchoolName?: string
  previousSchoolNpsn?: string
  previousSchoolAddress?: string
  graduationYear?: number
}

export interface UpdateMyApplicationInput {
  applicationId: string
  data: UpdateMyApplicationFields
  parents?: AdmissionApplicationParentInput[]
  achievements?: AdmissionAchievementInput[]
  scholarships?: AdmissionScholarshipInput[]
  sharedAddress?: ParentSharedAddress
}

export interface ParentSharedAddress {
  street: string | null
  rt: string | null
  rw: string | null
  postalCode: string | null
  provinceCode: string | null
  regencyCode: string | null
  districtCode: string | null
  villageCode: string | null
  province: string | null
  city: string | null
  district: string | null
  village: string | null
}

export interface CreateAdmissionNotificationInput {
  applicationId: string
  type: `${AdmissionNotificationType}`
  title: string
  message: string
}

export abstract class IAdmissionApplicantRepository {
  abstract findAll(): Promise<ActiveWaveRow[]>
  abstract findById(id: string): Promise<AdmissionApplicantEntity | null>
  abstract findByUserId(
    userId: string,
  ): Promise<AdmissionApplicantEntity | null>
  abstract findByRegistrationNumber(
    regNum: string,
  ): Promise<AdmissionApplicantEntity | null>
  abstract create(applicationId: string): Promise<ApplicationWithParentsAndUser>
  abstract update(
    id: string,
    input: UpdateMyApplicationFields,
  ): Promise<AdmissionApplicantEntity>
  abstract remove(id: string): Promise<AdmissionApplicantEntity>

  abstract findOpenWave(waveId: string): Promise<AdmissionWaveEntity | null>
  abstract findActiveWave(): Promise<AdmissionWaveEntity | null>
  abstract ensureApplication(
    input: EnsureApplicationInput,
  ): Promise<ApplicationWithParentsAndUser>
  abstract isIdentifierTaken(identifier: string): Promise<boolean>
  abstract findMyDetail(
    userId: string,
  ): Promise<ApplicationWithParentsAndUser | null>
  abstract findDetailById(
    applicationId: string,
  ): Promise<ApplicationWithParentsAndUser | null>
  abstract findRequiredActiveDocumentTypes(): Promise<
    AdmissionDocumentTypeRow[]
  >
  abstract submitApplication(
    applicationId: string,
  ): Promise<ApplicationWithParentsAndUser>
  abstract findMyApplication(
    userId: string,
  ): Promise<ApplicationWithDocsAndPayment | null>
  abstract updateMyApplication(
    input: UpdateMyApplicationInput,
  ): Promise<ApplicationWithParentsAndUser>
  abstract countApplicationFiles(
    applicationId: string,
    fileIds: string[],
  ): Promise<number>
  abstract createNotification(
    input: CreateAdmissionNotificationInput,
  ): Promise<AdmissionNotificationEntity>
  abstract findActiveWaves(): Promise<ActiveWaveRow[]>
  abstract findActiveDocumentTypes(): Promise<AdmissionDocumentTypeRow[]>
  abstract findPublishedAnnouncementsForUser(
    userId: string,
  ): Promise<AdmissionAnnouncementWithWave[]>
  abstract registerApplicant(
    input: RegisterApplicantInput,
  ): Promise<ApplicationWithParentsAndUser>
}
