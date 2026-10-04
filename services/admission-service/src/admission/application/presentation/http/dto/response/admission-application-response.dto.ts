import type { AcademicYearRef } from '../../../../../../shared/domain/entities/index.js'
import type { GetActiveWavesUseCase } from '../../../../../wave/application/use-cases/get-active-waves/get-active-waves.use-case.js'
import type { GetMyApplicationUseCase } from '../../../../../applicant/application/use-cases/get-my-application/get-my-application.use-case.js'
import type { UpdateMyApplicationUseCase } from '../../../../../applicant/application/use-cases/update-my-application/update-my-application.use-case.js'
import type { RegisterApplicantUseCase } from '../../../../../applicant/application/use-cases/register-applicant/register-applicant.use-case.js'
import type { EnrollApplicantUseCase } from '../../../../application/use-cases/enroll-applicant/enroll-applicant.use-case.js'
import type { AcceptApplicationUseCase } from '../../../../application/use-cases/accept-application/accept-application.use-case.js'
import type { RequestRevisionUseCase } from '../../../../application/use-cases/request-revision/request-revision.use-case.js'
import type { VerifyPaymentUseCase } from '../../../../../payment/application/use-cases/verify-payment/verify-payment.use-case.js'
import type { AdmissionDocumentWithTypeAndFile } from '../../../../../document/domain/entities/admission-document.entity.js'
import type { GetApplicationByIdUseCase } from '../../../../application/use-cases/get-application-by-id/get-application-by-id.use-case.js'
import type { AdmissionApplicationListRow } from '../../../../domain/entities/admission-application.entity.js'
import type { GetApplicationsUseCase } from '../../../../application/use-cases/get-applications/get-applications.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetAdmissionStatsUseCase } from '../../../../application/use-cases/get-admission-stats/get-admission-stats.use-case.js'
import type { AdmissionFileRef } from '../../../../../document/index.js'
import type {
  AdmissionAchievementRow,
  AdmissionScholarshipRow,
} from '../../../../domain/entities/admission-application.entity.js'

export class AdmissionPaymentBankAccountDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  bankName!: string

  @ApiProperty({ type: String })
  accountNumber!: string

  @ApiProperty({ type: String })
  accountHolder!: string

  static fromDomain(domain: {
    id: string
    bankName: string
    accountNumber: string
    accountHolder: string
  }): AdmissionPaymentBankAccountDto {
    const dto = new AdmissionPaymentBankAccountDto()
    dto.id = domain.id
    dto.bankName = domain.bankName
    dto.accountNumber = domain.accountNumber
    dto.accountHolder = domain.accountHolder
    return dto
  }
}

export class AdmissionApplicationWaveAcademicYearResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: AcademicYearRef,
  ): AdmissionApplicationWaveAcademicYearResponseDto {
    const dto = new AdmissionApplicationWaveAcademicYearResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionStatsResponseWavesDto {
  @ApiPropertyOptional({ type: String })
  id?: string

  @ApiPropertyOptional({ type: String })
  name?: string

  @ApiPropertyOptional({ type: String })
  code?: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  accepted!: number

  @ApiProperty({ type: Number })
  quotaFillRate!: number

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetAdmissionStatsUseCase['execute']>>['waves']
      >[number]
    >,
  ): AdmissionStatsResponseWavesDto {
    const dto = new AdmissionStatsResponseWavesDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.code = domain.code
    dto.quota = domain.quota
    dto.accepted = domain.accepted
    dto.quotaFillRate = domain.quotaFillRate
    return dto
  }
}

export class AdmissionStatsResponseDto {
  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byStatus!: Record<string, number>

  @ApiProperty({ type: () => AdmissionStatsResponseWavesDto, isArray: true })
  waves!: AdmissionStatsResponseWavesDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetAdmissionStatsUseCase['execute']>>,
  ): AdmissionStatsResponseDto {
    const dto = new AdmissionStatsResponseDto()
    dto.total = domain.total
    dto.byStatus = { ...domain.byStatus }
    dto.waves = domain.waves.map((x) =>
      AdmissionStatsResponseWavesDto.fromDomain(x),
    )
    return dto
  }
}

export class AdmissionApplicationSummaryResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  code!: string

  static fromDomain(
    domain: NonNullable<AdmissionApplicationListRow['wave']>,
  ): AdmissionApplicationSummaryResponseWaveDto {
    const dto = new AdmissionApplicationSummaryResponseWaveDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.code = domain.code
    return dto
  }
}

export class AdmissionApplicationSummaryResponsePaymentDto {
  @ApiProperty({ enum: ['UNPAID', 'PENDING', 'VERIFIED', 'REJECTED'] })
  status!: 'UNPAID' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  static fromDomain(
    domain: NonNullable<AdmissionApplicationListRow['payment']>,
  ): AdmissionApplicationSummaryResponsePaymentDto {
    const dto = new AdmissionApplicationSummaryResponsePaymentDto()
    dto.status = domain.status
    return dto
  }
}

export class AdmissionApplicationSummaryResponseCountDto {
  @ApiProperty({ type: Number })
  documents!: number

  static fromDomain(
    domain: NonNullable<AdmissionApplicationListRow['_count']>,
  ): AdmissionApplicationSummaryResponseCountDto {
    const dto = new AdmissionApplicationSummaryResponseCountDto()
    dto.documents = domain.documents
    return dto
  }
}

export class AdmissionApplicationSummaryResponseDto {
  @ApiProperty({ type: String })
  registrationNumber!: string

  @ApiProperty({ type: String })
  fullName!: string

  @ApiProperty({ type: String, nullable: true })
  email!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationSummaryResponseWaveDto,
  })
  wave?: AdmissionApplicationSummaryResponseWaveDto

  @ApiPropertyOptional({
    type: () => AdmissionApplicationSummaryResponsePaymentDto,
    nullable: true,
  })
  payment?: AdmissionApplicationSummaryResponsePaymentDto | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationSummaryResponseCountDto,
  })
  _count?: AdmissionApplicationSummaryResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'VERIFIED',
      'REJECTED',
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'ACCEPTED',
      'ENROLLING',
      'ENROLLED',
    ],
  })
  status!:
    | 'VERIFIED'
    | 'REJECTED'
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: AdmissionApplicationListRow,
  ): AdmissionApplicationSummaryResponseDto {
    const dto = new AdmissionApplicationSummaryResponseDto()
    dto.registrationNumber = domain.registrationNumber
    dto.fullName = domain.fullName
    dto.email = domain.email
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionApplicationSummaryResponseWaveDto.fromDomain(domain.wave)
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : AdmissionApplicationSummaryResponsePaymentDto.fromDomain(
              domain.payment,
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : AdmissionApplicationSummaryResponseCountDto.fromDomain(
              domain._count,
            )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.userId = domain.userId
    dto.nickname = domain.nickname
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nik = domain.nik
    dto.nisn = domain.nisn
    dto.religionId = domain.religionId
    dto.phone = domain.phone
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetApplicationsUseCase['execute']>>['meta'],
  ): AdmissionApplicationListResponseMetaDto {
    const dto = new AdmissionApplicationListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class AdmissionApplicationListResponseDto {
  @ApiProperty({ type: () => [AdmissionApplicationSummaryResponseDto] })
  data!: AdmissionApplicationSummaryResponseDto[]

  @ApiProperty({ type: () => AdmissionApplicationListResponseMetaDto })
  meta!: AdmissionApplicationListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetApplicationsUseCase['execute']>>,
  ): AdmissionApplicationListResponseDto {
    const dto = new AdmissionApplicationListResponseDto()
    dto.data = domain.data.map((item) =>
      AdmissionApplicationSummaryResponseDto.fromDomain(item),
    )
    dto.meta = AdmissionApplicationListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class AdmissionApplicationReviewResponseDocumentTypesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<GetApplicationByIdUseCase['execute']>
        >['documentTypes']
      >[number]
    >,
  ): AdmissionApplicationReviewResponseDocumentTypesDto {
    const dto = new AdmissionApplicationReviewResponseDocumentTypesDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class AdmissionApplicationReviewResponseReligionDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['religion']
    >,
  ): AdmissionApplicationReviewResponseReligionDto {
    const dto = new AdmissionApplicationReviewResponseReligionDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationReviewResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastLoginAt?: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['user']
    >,
  ): AdmissionApplicationReviewResponseUserDto {
    const dto = new AdmissionApplicationReviewResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    if (domain.lastLoginAt !== undefined)
      dto.lastLoginAt =
        domain.lastLoginAt == null
          ? domain.lastLoginAt
          : domain.lastLoginAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationReviewResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => AdmissionApplicationWaveAcademicYearResponseDto,
    nullable: true,
  })
  academicYear?: AdmissionApplicationWaveAcademicYearResponseDto | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['wave']
    >,
  ): AdmissionApplicationReviewResponseWaveDto {
    const dto = new AdmissionApplicationReviewResponseWaveDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : AdmissionApplicationWaveAcademicYearResponseDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class AdmissionApplicationReviewResponseDocumentsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['documents']
        >[number]
      >['file']
    >,
  ): AdmissionApplicationReviewResponseDocumentsFileDto {
    const dto = new AdmissionApplicationReviewResponseDocumentsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationReviewResponseDocumentsDocumentTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['documents']
        >[number]
      >['documentType']
    >,
  ): AdmissionApplicationReviewResponseDocumentsDocumentTypeDto {
    const dto = new AdmissionApplicationReviewResponseDocumentsDocumentTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class AdmissionApplicationReviewResponseDocumentsDto {
  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseDocumentsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationReviewResponseDocumentsFileDto | null

  @ApiProperty({
    type: () => AdmissionApplicationReviewResponseDocumentsDocumentTypeDto,
  })
  documentType!: AdmissionApplicationReviewResponseDocumentsDocumentTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['REJECTED', 'PENDING', 'APPROVED'] })
  status!: 'REJECTED' | 'PENDING' | 'APPROVED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['documents']
      >[number]
    >,
  ): AdmissionApplicationReviewResponseDocumentsDto {
    const dto = new AdmissionApplicationReviewResponseDocumentsDto()
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationReviewResponseDocumentsFileDto.fromDomain(
              domain.file,
            )
    dto.documentType =
      AdmissionApplicationReviewResponseDocumentsDocumentTypeDto.fromDomain(
        domain.documentType,
      )
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationReviewResponsePaymentProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['payment']
      >['proofFile']
    >,
  ): AdmissionApplicationReviewResponsePaymentProofFileDto {
    const dto = new AdmissionApplicationReviewResponsePaymentProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationReviewResponsePaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'PENDING', 'UNPAID'] })
  status!: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'UNPAID'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponsePaymentProofFileDto,
    nullable: true,
  })
  proofFile?: AdmissionApplicationReviewResponsePaymentProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['payment']
    >,
  ): AdmissionApplicationReviewResponsePaymentDto {
    const dto = new AdmissionApplicationReviewResponsePaymentDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = domain.amount
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : AdmissionApplicationReviewResponsePaymentProofFileDto.fromDomain(
              domain.proofFile,
            )
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationReviewResponseParentsOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['parents']
        >[number]
      >['occupation']
    >,
  ): AdmissionApplicationReviewResponseParentsOccupationDto {
    const dto = new AdmissionApplicationReviewResponseParentsOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationReviewResponseParentsEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['parents']
        >[number]
      >['education']
    >,
  ): AdmissionApplicationReviewResponseParentsEducationDto {
    const dto = new AdmissionApplicationReviewResponseParentsEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationReviewResponseParentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  nik!: string | null

  @ApiProperty({ type: String, nullable: true })
  birthPlace!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  birthDate!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String, nullable: true })
  occupationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  incomeRangeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  lifeStatusId!: string | null

  @ApiProperty({ type: String, nullable: true })
  domicileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  residenceId!: string | null

  @ApiProperty({ type: Boolean })
  sameAddressAsStudent!: boolean

  @ApiProperty({ type: String, nullable: true })
  street!: string | null

  @ApiProperty({ type: String, nullable: true })
  rt!: string | null

  @ApiProperty({ type: String, nullable: true })
  rw!: string | null

  @ApiProperty({ type: String, nullable: true })
  village!: string | null

  @ApiProperty({ type: String, nullable: true })
  district!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: String, nullable: true })
  province!: string | null

  @ApiProperty({ type: String, nullable: true })
  postalCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({
    type: () => AdmissionApplicationReviewResponseParentsOccupationDto,
    nullable: true,
  })
  occupation!: AdmissionApplicationReviewResponseParentsOccupationDto | null

  @ApiProperty({
    type: () => AdmissionApplicationReviewResponseParentsEducationDto,
    nullable: true,
  })
  education!: AdmissionApplicationReviewResponseParentsEducationDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>['parents']
      >[number]
    >,
  ): AdmissionApplicationReviewResponseParentsDto {
    const dto = new AdmissionApplicationReviewResponseParentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.relation = domain.relation
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate =
      domain.birthDate == null
        ? domain.birthDate
        : domain.birthDate.toISOString()
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.incomeRangeId = domain.incomeRangeId
    dto.lifeStatusId = domain.lifeStatusId
    dto.domicileId = domain.domicileId
    dto.residenceId = domain.residenceId
    dto.sameAddressAsStudent = domain.sameAddressAsStudent
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.isPrimary = domain.isPrimary
    dto.occupation =
      domain.occupation == null
        ? domain.occupation
        : AdmissionApplicationReviewResponseParentsOccupationDto.fromDomain(
            domain.occupation,
          )
    dto.education =
      domain.education == null
        ? domain.education
        : AdmissionApplicationReviewResponseParentsEducationDto.fromDomain(
            domain.education,
          )
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationReviewResponseAchievementsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionApplicationReviewResponseAchievementsFileDto {
    const dto = new AdmissionApplicationReviewResponseAchievementsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationReviewResponseAchievementsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String })
  competitionName!: string

  @ApiProperty({ type: String, nullable: true })
  competitionFieldId!: string | null

  @ApiProperty({ type: String, nullable: true })
  organizer!: string | null

  @ApiProperty({ type: String, nullable: true })
  competitionLevelId!: string | null

  @ApiProperty({ type: String, nullable: true })
  rank!: string | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseAchievementsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationReviewResponseAchievementsFileDto | null

  static fromDomain(
    domain: AdmissionAchievementRow,
  ): AdmissionApplicationReviewResponseAchievementsDto {
    const dto = new AdmissionApplicationReviewResponseAchievementsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.competitionName = domain.competitionName
    dto.competitionFieldId = domain.competitionFieldId
    dto.organizer = domain.organizer
    dto.competitionLevelId = domain.competitionLevelId
    dto.rank = domain.rank
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationReviewResponseAchievementsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionApplicationReviewResponseScholarshipsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionApplicationReviewResponseScholarshipsFileDto {
    const dto = new AdmissionApplicationReviewResponseScholarshipsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationReviewResponseScholarshipsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  scholarshipName!: string

  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null

  @ApiProperty({ type: String, nullable: true })
  providerTypeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  duration!: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  kipNumber?: string | null

  @ApiProperty({ type: Number, nullable: true })
  amount!: number | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseScholarshipsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationReviewResponseScholarshipsFileDto | null

  static fromDomain(
    domain: AdmissionScholarshipRow,
  ): AdmissionApplicationReviewResponseScholarshipsDto {
    const dto = new AdmissionApplicationReviewResponseScholarshipsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.categoryId = domain.categoryId
    dto.scholarshipName = domain.scholarshipName
    dto.providerName = domain.providerName
    dto.providerTypeId = domain.providerTypeId
    dto.duration = domain.duration
    dto.kipNumber = domain.kipNumber
    dto.amount = domain.amount == null ? null : Number(domain.amount)
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationReviewResponseScholarshipsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionApplicationReviewResponseDto {
  @ApiProperty({ type: Number })
  duplicateNikCount!: number

  @ApiProperty({
    type: () => AdmissionApplicationReviewResponseDocumentTypesDto,
    isArray: true,
  })
  documentTypes!: AdmissionApplicationReviewResponseDocumentTypesDto[]

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: String })
  fullName?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseReligionDto,
    nullable: true,
  })
  religion?: AdmissionApplicationReviewResponseReligionDto | null

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseUserDto,
  })
  user?: AdmissionApplicationReviewResponseUserDto

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseWaveDto,
  })
  wave?: AdmissionApplicationReviewResponseWaveDto

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseDocumentsDto,
    isArray: true,
  })
  documents?: AdmissionApplicationReviewResponseDocumentsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponsePaymentDto,
    nullable: true,
  })
  payment?: AdmissionApplicationReviewResponsePaymentDto | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseParentsDto,
    isArray: true,
  })
  parents?: AdmissionApplicationReviewResponseParentsDto[]

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  hobby?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  aspiration?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  financingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  disabilityTypeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  specialNeedId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  studentResidenceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelDistanceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelTimeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  transportationId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseAchievementsDto,
    isArray: true,
  })
  achievements?: AdmissionApplicationReviewResponseAchievementsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionApplicationReviewResponseScholarshipsDto,
    isArray: true,
  })
  scholarships?: AdmissionApplicationReviewResponseScholarshipsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'VERIFIED',
      'ACCEPTED',
      'ENROLLING',
      'REJECTED',
      'ENROLLED',
    ],
  })
  status!:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'VERIFIED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'REJECTED'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<GetApplicationByIdUseCase['execute']>>,
  ): AdmissionApplicationReviewResponseDto {
    const dto = new AdmissionApplicationReviewResponseDto()
    dto.duplicateNikCount = domain.duplicateNikCount
    dto.documentTypes = domain.documentTypes.map((x) =>
      AdmissionApplicationReviewResponseDocumentTypesDto.fromDomain(x),
    )
    dto.userId = domain.userId
    dto.fullName = domain.fullName
    dto.nickname = domain.nickname
    dto.nik = domain.nik
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nisn = domain.nisn
    dto.email = domain.email
    dto.phone = domain.phone
    dto.religionId = domain.religionId
    if (domain.religion !== undefined)
      dto.religion =
        domain.religion == null
          ? domain.religion
          : AdmissionApplicationReviewResponseReligionDto.fromDomain(
              domain.religion,
            )
    dto.registrationNumber = domain.registrationNumber
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : AdmissionApplicationReviewResponseUserDto.fromDomain(domain.user)
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionApplicationReviewResponseWaveDto.fromDomain(domain.wave)
    if (domain.documents !== undefined)
      dto.documents =
        domain.documents == null
          ? domain.documents
          : domain.documents.map((x) =>
              AdmissionApplicationReviewResponseDocumentsDto.fromDomain(x),
            )
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : AdmissionApplicationReviewResponsePaymentDto.fromDomain(
              domain.payment,
            )
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              AdmissionApplicationReviewResponseParentsDto.fromDomain(x),
            )
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.hobby = domain.hobby
    dto.aspiration = domain.aspiration
    dto.financingSourceId = domain.financingSourceId
    dto.disabilityTypeId = domain.disabilityTypeId
    dto.specialNeedId = domain.specialNeedId
    dto.studentResidenceId = domain.studentResidenceId
    dto.travelDistanceId = domain.travelDistanceId
    dto.travelTimeId = domain.travelTimeId
    dto.transportationId = domain.transportationId
    if (domain.achievements !== undefined)
      dto.achievements = domain.achievements.map((x) =>
        AdmissionApplicationReviewResponseAchievementsDto.fromDomain(x),
      )
    if (domain.scholarships !== undefined)
      dto.scholarships = domain.scholarships.map((x) =>
        AdmissionApplicationReviewResponseScholarshipsDto.fromDomain(x),
      )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionDocumentResponseFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<AdmissionDocumentWithTypeAndFile['file']>,
  ): AdmissionDocumentResponseFileDto {
    const dto = new AdmissionDocumentResponseFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionDocumentResponseDocumentTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<AdmissionDocumentWithTypeAndFile['documentType']>,
  ): AdmissionDocumentResponseDocumentTypeDto {
    const dto = new AdmissionDocumentResponseDocumentTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class AdmissionDocumentResponseDto {
  @ApiPropertyOptional({
    type: () => AdmissionDocumentResponseFileDto,
    nullable: true,
  })
  file?: AdmissionDocumentResponseFileDto | null

  @ApiProperty({ type: () => AdmissionDocumentResponseDocumentTypeDto })
  documentType!: AdmissionDocumentResponseDocumentTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: AdmissionDocumentWithTypeAndFile,
  ): AdmissionDocumentResponseDto {
    const dto = new AdmissionDocumentResponseDto()
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionDocumentResponseFileDto.fromDomain(domain.file)
    dto.documentType = AdmissionDocumentResponseDocumentTypeDto.fromDomain(
      domain.documentType,
    )
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionPaymentResponseProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<VerifyPaymentUseCase['execute']>>['proofFile']
    >,
  ): AdmissionPaymentResponseProofFileDto {
    const dto = new AdmissionPaymentResponseProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionPaymentResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['UNPAID', 'PENDING', 'VERIFIED', 'REJECTED'] })
  status!: 'UNPAID' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentResponseProofFileDto,
    nullable: true,
  })
  proofFile?: AdmissionPaymentResponseProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: Awaited<ReturnType<VerifyPaymentUseCase['execute']>>,
  ): AdmissionPaymentResponseDto {
    const dto = new AdmissionPaymentResponseDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = domain.amount
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : AdmissionPaymentResponseProofFileDto.fromDomain(domain.proofFile)
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationResponseDocumentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<RequestRevisionUseCase['execute']>>['documents']
      >[number]
    >,
  ): AdmissionApplicationResponseDocumentsDto {
    const dto = new AdmissionApplicationResponseDocumentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationResponsePaymentProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<RequestRevisionUseCase['execute']>>['payment']
      >['proofFile']
    >,
  ): AdmissionApplicationResponsePaymentProofFileDto {
    const dto = new AdmissionApplicationResponsePaymentProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationResponsePaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['PENDING', 'REJECTED', 'UNPAID', 'VERIFIED'] })
  status!: 'PENDING' | 'REJECTED' | 'UNPAID' | 'VERIFIED'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponsePaymentProofFileDto,
    nullable: true,
  })
  proofFile?: AdmissionApplicationResponsePaymentProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<RequestRevisionUseCase['execute']>>['payment']
    >,
  ): AdmissionApplicationResponsePaymentDto {
    const dto = new AdmissionApplicationResponsePaymentDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = domain.amount
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : AdmissionApplicationResponsePaymentProofFileDto.fromDomain(
              domain.proofFile,
            )
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<RequestRevisionUseCase['execute']>>['wave']
    >,
  ): AdmissionApplicationResponseWaveDto {
    const dto = new AdmissionApplicationResponseWaveDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationResponseParentsOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<RequestRevisionUseCase['execute']>>['parents']
        >[number]
      >['occupation']
    >,
  ): AdmissionApplicationResponseParentsOccupationDto {
    const dto = new AdmissionApplicationResponseParentsOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationResponseParentsEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<RequestRevisionUseCase['execute']>>['parents']
        >[number]
      >['education']
    >,
  ): AdmissionApplicationResponseParentsEducationDto {
    const dto = new AdmissionApplicationResponseParentsEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationResponseParentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  nik!: string | null

  @ApiProperty({ type: String, nullable: true })
  birthPlace!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  birthDate!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String, nullable: true })
  occupationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  incomeRangeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  lifeStatusId!: string | null

  @ApiProperty({ type: String, nullable: true })
  domicileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  residenceId!: string | null

  @ApiProperty({ type: Boolean })
  sameAddressAsStudent!: boolean

  @ApiProperty({ type: String, nullable: true })
  street!: string | null

  @ApiProperty({ type: String, nullable: true })
  rt!: string | null

  @ApiProperty({ type: String, nullable: true })
  rw!: string | null

  @ApiProperty({ type: String, nullable: true })
  village!: string | null

  @ApiProperty({ type: String, nullable: true })
  district!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: String, nullable: true })
  province!: string | null

  @ApiProperty({ type: String, nullable: true })
  postalCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({
    type: () => AdmissionApplicationResponseParentsOccupationDto,
    nullable: true,
  })
  occupation!: AdmissionApplicationResponseParentsOccupationDto | null

  @ApiProperty({
    type: () => AdmissionApplicationResponseParentsEducationDto,
    nullable: true,
  })
  education!: AdmissionApplicationResponseParentsEducationDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<RequestRevisionUseCase['execute']>>['parents']
      >[number]
    >,
  ): AdmissionApplicationResponseParentsDto {
    const dto = new AdmissionApplicationResponseParentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.relation = domain.relation
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate =
      domain.birthDate == null
        ? domain.birthDate
        : domain.birthDate.toISOString()
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.incomeRangeId = domain.incomeRangeId
    dto.lifeStatusId = domain.lifeStatusId
    dto.domicileId = domain.domicileId
    dto.residenceId = domain.residenceId
    dto.sameAddressAsStudent = domain.sameAddressAsStudent
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.isPrimary = domain.isPrimary
    dto.occupation =
      domain.occupation == null
        ? domain.occupation
        : AdmissionApplicationResponseParentsOccupationDto.fromDomain(
            domain.occupation,
          )
    dto.education =
      domain.education == null
        ? domain.education
        : AdmissionApplicationResponseParentsEducationDto.fromDomain(
            domain.education,
          )
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationResponseAchievementsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionApplicationResponseAchievementsFileDto {
    const dto = new AdmissionApplicationResponseAchievementsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationResponseAchievementsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String })
  competitionName!: string

  @ApiProperty({ type: String, nullable: true })
  competitionFieldId!: string | null

  @ApiProperty({ type: String, nullable: true })
  organizer!: string | null

  @ApiProperty({ type: String, nullable: true })
  competitionLevelId!: string | null

  @ApiProperty({ type: String, nullable: true })
  rank!: string | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponseAchievementsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationResponseAchievementsFileDto | null

  static fromDomain(
    domain: AdmissionAchievementRow,
  ): AdmissionApplicationResponseAchievementsDto {
    const dto = new AdmissionApplicationResponseAchievementsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.competitionName = domain.competitionName
    dto.competitionFieldId = domain.competitionFieldId
    dto.organizer = domain.organizer
    dto.competitionLevelId = domain.competitionLevelId
    dto.rank = domain.rank
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationResponseAchievementsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionApplicationResponseScholarshipsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionApplicationResponseScholarshipsFileDto {
    const dto = new AdmissionApplicationResponseScholarshipsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationResponseScholarshipsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  scholarshipName!: string

  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null

  @ApiProperty({ type: String, nullable: true })
  providerTypeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  duration!: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  kipNumber?: string | null

  @ApiProperty({ type: Number, nullable: true })
  amount!: number | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponseScholarshipsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationResponseScholarshipsFileDto | null

  static fromDomain(
    domain: AdmissionScholarshipRow,
  ): AdmissionApplicationResponseScholarshipsDto {
    const dto = new AdmissionApplicationResponseScholarshipsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.categoryId = domain.categoryId
    dto.scholarshipName = domain.scholarshipName
    dto.providerName = domain.providerName
    dto.providerTypeId = domain.providerTypeId
    dto.duration = domain.duration
    dto.kipNumber = domain.kipNumber
    dto.amount = domain.amount == null ? null : Number(domain.amount)
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationResponseScholarshipsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionApplicationResponseDto {
  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponseDocumentsDto,
    isArray: true,
  })
  documents?: AdmissionApplicationResponseDocumentsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponsePaymentDto,
    nullable: true,
  })
  payment?: AdmissionApplicationResponsePaymentDto | null

  @ApiPropertyOptional({ type: () => AdmissionApplicationResponseWaveDto })
  wave?: AdmissionApplicationResponseWaveDto

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponseParentsDto,
    isArray: true,
  })
  parents?: AdmissionApplicationResponseParentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'REJECTED',
      'VERIFIED',
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'ACCEPTED',
      'ENROLLING',
      'ENROLLED',
    ],
  })
  status!:
    | 'REJECTED'
    | 'VERIFIED'
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiPropertyOptional({ type: String })
  fullName?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  hobby?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  aspiration?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  financingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  disabilityTypeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  specialNeedId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  studentResidenceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelDistanceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelTimeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  transportationId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponseAchievementsDto,
    isArray: true,
  })
  achievements?: AdmissionApplicationResponseAchievementsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionApplicationResponseScholarshipsDto,
    isArray: true,
  })
  scholarships?: AdmissionApplicationResponseScholarshipsDto[]

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<RequestRevisionUseCase['execute']>>,
  ): AdmissionApplicationResponseDto {
    const dto = new AdmissionApplicationResponseDto()
    if (domain.documents !== undefined)
      dto.documents =
        domain.documents == null
          ? domain.documents
          : domain.documents.map((x) =>
              AdmissionApplicationResponseDocumentsDto.fromDomain(x),
            )
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : AdmissionApplicationResponsePaymentDto.fromDomain(domain.payment)
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionApplicationResponseWaveDto.fromDomain(domain.wave)
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              AdmissionApplicationResponseParentsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.userId = domain.userId
    dto.registrationNumber = domain.registrationNumber
    dto.fullName = domain.fullName
    dto.nickname = domain.nickname
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nik = domain.nik
    dto.nisn = domain.nisn
    dto.religionId = domain.religionId
    dto.phone = domain.phone
    dto.email = domain.email
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.hobby = domain.hobby
    dto.aspiration = domain.aspiration
    dto.financingSourceId = domain.financingSourceId
    dto.disabilityTypeId = domain.disabilityTypeId
    dto.specialNeedId = domain.specialNeedId
    dto.studentResidenceId = domain.studentResidenceId
    dto.travelDistanceId = domain.travelDistanceId
    dto.travelTimeId = domain.travelTimeId
    dto.transportationId = domain.transportationId
    if (domain.achievements !== undefined)
      dto.achievements = domain.achievements.map((x) =>
        AdmissionApplicationResponseAchievementsDto.fromDomain(x),
      )
    if (domain.scholarships !== undefined)
      dto.scholarships = domain.scholarships.map((x) =>
        AdmissionApplicationResponseScholarshipsDto.fromDomain(x),
      )
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseDocumentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['REJECTED', 'PENDING', 'APPROVED'] })
  status!: 'REJECTED' | 'PENDING' | 'APPROVED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['documents']
      >[number]
    >,
  ): AdmissionAcceptedApplicationResponseDocumentsDto {
    const dto = new AdmissionAcceptedApplicationResponseDocumentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionAcceptedApplicationResponsePaymentProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['payment']
      >['proofFile']
    >,
  ): AdmissionAcceptedApplicationResponsePaymentProofFileDto {
    const dto = new AdmissionAcceptedApplicationResponsePaymentProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionAcceptedApplicationResponsePaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'PENDING', 'UNPAID'] })
  status!: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'UNPAID'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponsePaymentProofFileDto,
    nullable: true,
  })
  proofFile?: AdmissionAcceptedApplicationResponsePaymentProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['payment']
    >,
  ): AdmissionAcceptedApplicationResponsePaymentDto {
    const dto = new AdmissionAcceptedApplicationResponsePaymentDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = domain.amount
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : AdmissionAcceptedApplicationResponsePaymentProofFileDto.fromDomain(
              domain.proofFile,
            )
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['wave']
    >,
  ): AdmissionAcceptedApplicationResponseWaveDto {
    const dto = new AdmissionAcceptedApplicationResponseWaveDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseParentsOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['parents']
        >[number]
      >['occupation']
    >,
  ): AdmissionAcceptedApplicationResponseParentsOccupationDto {
    const dto = new AdmissionAcceptedApplicationResponseParentsOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseParentsEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['parents']
        >[number]
      >['education']
    >,
  ): AdmissionAcceptedApplicationResponseParentsEducationDto {
    const dto = new AdmissionAcceptedApplicationResponseParentsEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseParentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  nik!: string | null

  @ApiProperty({ type: String, nullable: true })
  birthPlace!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  birthDate!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String, nullable: true })
  occupationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  incomeRangeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  lifeStatusId!: string | null

  @ApiProperty({ type: String, nullable: true })
  domicileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  residenceId!: string | null

  @ApiProperty({ type: Boolean })
  sameAddressAsStudent!: boolean

  @ApiProperty({ type: String, nullable: true })
  street!: string | null

  @ApiProperty({ type: String, nullable: true })
  rt!: string | null

  @ApiProperty({ type: String, nullable: true })
  rw!: string | null

  @ApiProperty({ type: String, nullable: true })
  village!: string | null

  @ApiProperty({ type: String, nullable: true })
  district!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: String, nullable: true })
  province!: string | null

  @ApiProperty({ type: String, nullable: true })
  postalCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({
    type: () => AdmissionAcceptedApplicationResponseParentsOccupationDto,
    nullable: true,
  })
  occupation!: AdmissionAcceptedApplicationResponseParentsOccupationDto | null

  @ApiProperty({
    type: () => AdmissionAcceptedApplicationResponseParentsEducationDto,
    nullable: true,
  })
  education!: AdmissionAcceptedApplicationResponseParentsEducationDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<AcceptApplicationUseCase['execute']>>['parents']
      >[number]
    >,
  ): AdmissionAcceptedApplicationResponseParentsDto {
    const dto = new AdmissionAcceptedApplicationResponseParentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.relation = domain.relation
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate =
      domain.birthDate == null
        ? domain.birthDate
        : domain.birthDate.toISOString()
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.incomeRangeId = domain.incomeRangeId
    dto.lifeStatusId = domain.lifeStatusId
    dto.domicileId = domain.domicileId
    dto.residenceId = domain.residenceId
    dto.sameAddressAsStudent = domain.sameAddressAsStudent
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.isPrimary = domain.isPrimary
    dto.occupation =
      domain.occupation == null
        ? domain.occupation
        : AdmissionAcceptedApplicationResponseParentsOccupationDto.fromDomain(
            domain.occupation,
          )
    dto.education =
      domain.education == null
        ? domain.education
        : AdmissionAcceptedApplicationResponseParentsEducationDto.fromDomain(
            domain.education,
          )
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseAchievementsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionAcceptedApplicationResponseAchievementsFileDto {
    const dto = new AdmissionAcceptedApplicationResponseAchievementsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseAchievementsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String })
  competitionName!: string

  @ApiProperty({ type: String, nullable: true })
  competitionFieldId!: string | null

  @ApiProperty({ type: String, nullable: true })
  organizer!: string | null

  @ApiProperty({ type: String, nullable: true })
  competitionLevelId!: string | null

  @ApiProperty({ type: String, nullable: true })
  rank!: string | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseAchievementsFileDto,
    nullable: true,
  })
  file?: AdmissionAcceptedApplicationResponseAchievementsFileDto | null

  static fromDomain(
    domain: AdmissionAchievementRow,
  ): AdmissionAcceptedApplicationResponseAchievementsDto {
    const dto = new AdmissionAcceptedApplicationResponseAchievementsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.competitionName = domain.competitionName
    dto.competitionFieldId = domain.competitionFieldId
    dto.organizer = domain.organizer
    dto.competitionLevelId = domain.competitionLevelId
    dto.rank = domain.rank
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionAcceptedApplicationResponseAchievementsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseScholarshipsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionAcceptedApplicationResponseScholarshipsFileDto {
    const dto = new AdmissionAcceptedApplicationResponseScholarshipsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseScholarshipsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  scholarshipName!: string

  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null

  @ApiProperty({ type: String, nullable: true })
  providerTypeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  duration!: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  kipNumber?: string | null

  @ApiProperty({ type: Number, nullable: true })
  amount!: number | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseScholarshipsFileDto,
    nullable: true,
  })
  file?: AdmissionAcceptedApplicationResponseScholarshipsFileDto | null

  static fromDomain(
    domain: AdmissionScholarshipRow,
  ): AdmissionAcceptedApplicationResponseScholarshipsDto {
    const dto = new AdmissionAcceptedApplicationResponseScholarshipsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.categoryId = domain.categoryId
    dto.scholarshipName = domain.scholarshipName
    dto.providerName = domain.providerName
    dto.providerTypeId = domain.providerTypeId
    dto.duration = domain.duration
    dto.kipNumber = domain.kipNumber
    dto.amount = domain.amount == null ? null : Number(domain.amount)
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionAcceptedApplicationResponseScholarshipsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionAcceptedApplicationResponseDto {
  @ApiProperty({ type: String, nullable: true })
  quotaWarning!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseDocumentsDto,
    isArray: true,
  })
  documents?: AdmissionAcceptedApplicationResponseDocumentsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponsePaymentDto,
    nullable: true,
  })
  payment?: AdmissionAcceptedApplicationResponsePaymentDto | null

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseWaveDto,
  })
  wave?: AdmissionAcceptedApplicationResponseWaveDto

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseParentsDto,
    isArray: true,
  })
  parents?: AdmissionAcceptedApplicationResponseParentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'VERIFIED',
      'ACCEPTED',
      'ENROLLING',
      'REJECTED',
      'ENROLLED',
    ],
  })
  status!:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'VERIFIED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'REJECTED'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiPropertyOptional({ type: String })
  fullName?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  hobby?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  aspiration?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  financingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  disabilityTypeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  specialNeedId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  studentResidenceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelDistanceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelTimeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  transportationId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseAchievementsDto,
    isArray: true,
  })
  achievements?: AdmissionAcceptedApplicationResponseAchievementsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionAcceptedApplicationResponseScholarshipsDto,
    isArray: true,
  })
  scholarships?: AdmissionAcceptedApplicationResponseScholarshipsDto[]

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<AcceptApplicationUseCase['execute']>>,
  ): AdmissionAcceptedApplicationResponseDto {
    const dto = new AdmissionAcceptedApplicationResponseDto()
    dto.quotaWarning = domain.quotaWarning
    if (domain.documents !== undefined)
      dto.documents =
        domain.documents == null
          ? domain.documents
          : domain.documents.map((x) =>
              AdmissionAcceptedApplicationResponseDocumentsDto.fromDomain(x),
            )
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : AdmissionAcceptedApplicationResponsePaymentDto.fromDomain(
              domain.payment,
            )
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionAcceptedApplicationResponseWaveDto.fromDomain(domain.wave)
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              AdmissionAcceptedApplicationResponseParentsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.userId = domain.userId
    dto.registrationNumber = domain.registrationNumber
    dto.fullName = domain.fullName
    dto.nickname = domain.nickname
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nik = domain.nik
    dto.nisn = domain.nisn
    dto.religionId = domain.religionId
    dto.phone = domain.phone
    dto.email = domain.email
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.hobby = domain.hobby
    dto.aspiration = domain.aspiration
    dto.financingSourceId = domain.financingSourceId
    dto.disabilityTypeId = domain.disabilityTypeId
    dto.specialNeedId = domain.specialNeedId
    dto.studentResidenceId = domain.studentResidenceId
    dto.travelDistanceId = domain.travelDistanceId
    dto.travelTimeId = domain.travelTimeId
    dto.transportationId = domain.transportationId
    if (domain.achievements !== undefined)
      dto.achievements = domain.achievements.map((x) =>
        AdmissionAcceptedApplicationResponseAchievementsDto.fromDomain(x),
      )
    if (domain.scholarships !== undefined)
      dto.scholarships = domain.scholarships.map((x) =>
        AdmissionAcceptedApplicationResponseScholarshipsDto.fromDomain(x),
      )
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  parentsLinked!: number

  @ApiProperty({ type: Boolean })
  enrollmentCreated!: boolean

  @ApiProperty({ type: Boolean })
  alreadyEnrolled!: boolean

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['student']
    >,
  ): AdmissionEnrolledApplicationResponseStudentDto {
    const dto = new AdmissionEnrolledApplicationResponseStudentDto()
    dto.id = domain.id
    dto.parentsLinked = domain.parentsLinked
    dto.enrollmentCreated = domain.enrollmentCreated
    dto.alreadyEnrolled = domain.alreadyEnrolled
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseDocumentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['REJECTED', 'PENDING', 'APPROVED'] })
  status!: 'REJECTED' | 'PENDING' | 'APPROVED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['documents']
      >[number]
    >,
  ): AdmissionEnrolledApplicationResponseDocumentsDto {
    const dto = new AdmissionEnrolledApplicationResponseDocumentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionEnrolledApplicationResponsePaymentProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['payment']
      >['proofFile']
    >,
  ): AdmissionEnrolledApplicationResponsePaymentProofFileDto {
    const dto = new AdmissionEnrolledApplicationResponsePaymentProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionEnrolledApplicationResponsePaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'PENDING', 'UNPAID'] })
  status!: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'UNPAID'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponsePaymentProofFileDto,
    nullable: true,
  })
  proofFile?: AdmissionEnrolledApplicationResponsePaymentProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['payment']
    >,
  ): AdmissionEnrolledApplicationResponsePaymentDto {
    const dto = new AdmissionEnrolledApplicationResponsePaymentDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = Number(domain.amount)
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : AdmissionEnrolledApplicationResponsePaymentProofFileDto.fromDomain(
              domain.proofFile,
            )
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['wave']
    >,
  ): AdmissionEnrolledApplicationResponseWaveDto {
    const dto = new AdmissionEnrolledApplicationResponseWaveDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = Number(domain.registrationFee)
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseParentsOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['parents']
        >[number]
      >['occupation']
    >,
  ): AdmissionEnrolledApplicationResponseParentsOccupationDto {
    const dto = new AdmissionEnrolledApplicationResponseParentsOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseParentsEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['parents']
        >[number]
      >['education']
    >,
  ): AdmissionEnrolledApplicationResponseParentsEducationDto {
    const dto = new AdmissionEnrolledApplicationResponseParentsEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseParentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  nik!: string | null

  @ApiProperty({ type: String, nullable: true })
  birthPlace!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  birthDate!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String, nullable: true })
  occupationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  incomeRangeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  lifeStatusId!: string | null

  @ApiProperty({ type: String, nullable: true })
  domicileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  residenceId!: string | null

  @ApiProperty({ type: Boolean })
  sameAddressAsStudent!: boolean

  @ApiProperty({ type: String, nullable: true })
  street!: string | null

  @ApiProperty({ type: String, nullable: true })
  rt!: string | null

  @ApiProperty({ type: String, nullable: true })
  rw!: string | null

  @ApiProperty({ type: String, nullable: true })
  village!: string | null

  @ApiProperty({ type: String, nullable: true })
  district!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: String, nullable: true })
  province!: string | null

  @ApiProperty({ type: String, nullable: true })
  postalCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({
    type: () => AdmissionEnrolledApplicationResponseParentsOccupationDto,
    nullable: true,
  })
  occupation!: AdmissionEnrolledApplicationResponseParentsOccupationDto | null

  @ApiProperty({
    type: () => AdmissionEnrolledApplicationResponseParentsEducationDto,
    nullable: true,
  })
  education!: AdmissionEnrolledApplicationResponseParentsEducationDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<EnrollApplicantUseCase['execute']>>['parents']
      >[number]
    >,
  ): AdmissionEnrolledApplicationResponseParentsDto {
    const dto = new AdmissionEnrolledApplicationResponseParentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.relation = domain.relation
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate =
      domain.birthDate == null
        ? domain.birthDate
        : domain.birthDate.toISOString()
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.incomeRangeId = domain.incomeRangeId
    dto.lifeStatusId = domain.lifeStatusId
    dto.domicileId = domain.domicileId
    dto.residenceId = domain.residenceId
    dto.sameAddressAsStudent = domain.sameAddressAsStudent
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.isPrimary = domain.isPrimary
    dto.occupation =
      domain.occupation == null
        ? domain.occupation
        : AdmissionEnrolledApplicationResponseParentsOccupationDto.fromDomain(
            domain.occupation,
          )
    dto.education =
      domain.education == null
        ? domain.education
        : AdmissionEnrolledApplicationResponseParentsEducationDto.fromDomain(
            domain.education,
          )
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseAchievementsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionEnrolledApplicationResponseAchievementsFileDto {
    const dto = new AdmissionEnrolledApplicationResponseAchievementsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseAchievementsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String })
  competitionName!: string

  @ApiProperty({ type: String, nullable: true })
  competitionFieldId!: string | null

  @ApiProperty({ type: String, nullable: true })
  organizer!: string | null

  @ApiProperty({ type: String, nullable: true })
  competitionLevelId!: string | null

  @ApiProperty({ type: String, nullable: true })
  rank!: string | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseAchievementsFileDto,
    nullable: true,
  })
  file?: AdmissionEnrolledApplicationResponseAchievementsFileDto | null

  static fromDomain(
    domain: AdmissionAchievementRow,
  ): AdmissionEnrolledApplicationResponseAchievementsDto {
    const dto = new AdmissionEnrolledApplicationResponseAchievementsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.competitionName = domain.competitionName
    dto.competitionFieldId = domain.competitionFieldId
    dto.organizer = domain.organizer
    dto.competitionLevelId = domain.competitionLevelId
    dto.rank = domain.rank
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionEnrolledApplicationResponseAchievementsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseScholarshipsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionEnrolledApplicationResponseScholarshipsFileDto {
    const dto = new AdmissionEnrolledApplicationResponseScholarshipsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseScholarshipsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  scholarshipName!: string

  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null

  @ApiProperty({ type: String, nullable: true })
  providerTypeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  duration!: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  kipNumber?: string | null

  @ApiProperty({ type: Number, nullable: true })
  amount!: number | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseScholarshipsFileDto,
    nullable: true,
  })
  file?: AdmissionEnrolledApplicationResponseScholarshipsFileDto | null

  static fromDomain(
    domain: AdmissionScholarshipRow,
  ): AdmissionEnrolledApplicationResponseScholarshipsDto {
    const dto = new AdmissionEnrolledApplicationResponseScholarshipsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.categoryId = domain.categoryId
    dto.scholarshipName = domain.scholarshipName
    dto.providerName = domain.providerName
    dto.providerTypeId = domain.providerTypeId
    dto.duration = domain.duration
    dto.kipNumber = domain.kipNumber
    dto.amount = domain.amount == null ? null : Number(domain.amount)
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionEnrolledApplicationResponseScholarshipsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionEnrolledApplicationResponseDto {
  @ApiProperty({ type: () => AdmissionEnrolledApplicationResponseStudentDto })
  student!: AdmissionEnrolledApplicationResponseStudentDto

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseDocumentsDto,
    isArray: true,
  })
  documents?: AdmissionEnrolledApplicationResponseDocumentsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponsePaymentDto,
    nullable: true,
  })
  payment?: AdmissionEnrolledApplicationResponsePaymentDto | null

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseWaveDto,
  })
  wave?: AdmissionEnrolledApplicationResponseWaveDto

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseParentsDto,
    isArray: true,
  })
  parents?: AdmissionEnrolledApplicationResponseParentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'VERIFIED',
      'ACCEPTED',
      'ENROLLING',
      'REJECTED',
      'ENROLLED',
    ],
  })
  status!:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'VERIFIED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'REJECTED'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiPropertyOptional({ type: String })
  fullName?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  hobby?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  aspiration?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  financingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  disabilityTypeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  specialNeedId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  studentResidenceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelDistanceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelTimeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  transportationId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseAchievementsDto,
    isArray: true,
  })
  achievements?: AdmissionEnrolledApplicationResponseAchievementsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionEnrolledApplicationResponseScholarshipsDto,
    isArray: true,
  })
  scholarships?: AdmissionEnrolledApplicationResponseScholarshipsDto[]

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<EnrollApplicantUseCase['execute']>>,
  ): AdmissionEnrolledApplicationResponseDto {
    const dto = new AdmissionEnrolledApplicationResponseDto()
    dto.student = AdmissionEnrolledApplicationResponseStudentDto.fromDomain(
      domain.student,
    )
    if (domain.documents !== undefined)
      dto.documents =
        domain.documents == null
          ? domain.documents
          : domain.documents.map((x) =>
              AdmissionEnrolledApplicationResponseDocumentsDto.fromDomain(x),
            )
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : AdmissionEnrolledApplicationResponsePaymentDto.fromDomain(
              domain.payment,
            )
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionEnrolledApplicationResponseWaveDto.fromDomain(domain.wave)
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              AdmissionEnrolledApplicationResponseParentsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.userId = domain.userId
    dto.registrationNumber = domain.registrationNumber
    dto.fullName = domain.fullName
    dto.nickname = domain.nickname
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nik = domain.nik
    dto.nisn = domain.nisn
    dto.religionId = domain.religionId
    dto.phone = domain.phone
    dto.email = domain.email
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.hobby = domain.hobby
    dto.aspiration = domain.aspiration
    dto.financingSourceId = domain.financingSourceId
    dto.disabilityTypeId = domain.disabilityTypeId
    dto.specialNeedId = domain.specialNeedId
    dto.studentResidenceId = domain.studentResidenceId
    dto.travelDistanceId = domain.travelDistanceId
    dto.travelTimeId = domain.travelTimeId
    dto.transportationId = domain.transportationId
    if (domain.achievements !== undefined)
      dto.achievements = domain.achievements.map((x) =>
        AdmissionEnrolledApplicationResponseAchievementsDto.fromDomain(x),
      )
    if (domain.scholarships !== undefined)
      dto.scholarships = domain.scholarships.map((x) =>
        AdmissionEnrolledApplicationResponseScholarshipsDto.fromDomain(x),
      )
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionRegisteredApplicantResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiProperty({ type: String })
  identifier!: string

  static fromDomain(
    domain: Awaited<ReturnType<RegisterApplicantUseCase['execute']>>,
  ): AdmissionRegisteredApplicantResponseDto {
    const dto = new AdmissionRegisteredApplicantResponseDto()
    dto.id = domain.id
    dto.registrationNumber = domain.registrationNumber
    dto.identifier = domain.identifier
    return dto
  }
}

export class AdmissionApplicationFormResponseReligionDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
      >['religion']
    >,
  ): AdmissionApplicationFormResponseReligionDto {
    const dto = new AdmissionApplicationFormResponseReligionDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationFormResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastLoginAt?: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
      >['user']
    >,
  ): AdmissionApplicationFormResponseUserDto {
    const dto = new AdmissionApplicationFormResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    if (domain.lastLoginAt !== undefined)
      dto.lastLoginAt =
        domain.lastLoginAt == null
          ? domain.lastLoginAt
          : domain.lastLoginAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationFormResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => AdmissionApplicationWaveAcademicYearResponseDto,
    nullable: true,
  })
  academicYear?: AdmissionApplicationWaveAcademicYearResponseDto | null

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
      >['wave']
    >,
  ): AdmissionApplicationFormResponseWaveDto {
    const dto = new AdmissionApplicationFormResponseWaveDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : AdmissionApplicationWaveAcademicYearResponseDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class AdmissionApplicationFormResponseDocumentsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
          >['documents']
        >[number]
      >['file']
    >,
  ): AdmissionApplicationFormResponseDocumentsFileDto {
    const dto = new AdmissionApplicationFormResponseDocumentsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationFormResponseDocumentsDocumentTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
          >['documents']
        >[number]
      >['documentType']
    >,
  ): AdmissionApplicationFormResponseDocumentsDocumentTypeDto {
    const dto = new AdmissionApplicationFormResponseDocumentsDocumentTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class AdmissionApplicationFormResponseDocumentsDto {
  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseDocumentsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationFormResponseDocumentsFileDto | null

  @ApiProperty({
    type: () => AdmissionApplicationFormResponseDocumentsDocumentTypeDto,
  })
  documentType!: AdmissionApplicationFormResponseDocumentsDocumentTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['REJECTED', 'PENDING', 'APPROVED'] })
  status!: 'REJECTED' | 'PENDING' | 'APPROVED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
        >['documents']
      >[number]
    >,
  ): AdmissionApplicationFormResponseDocumentsDto {
    const dto = new AdmissionApplicationFormResponseDocumentsDto()
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationFormResponseDocumentsFileDto.fromDomain(
              domain.file,
            )
    dto.documentType =
      AdmissionApplicationFormResponseDocumentsDocumentTypeDto.fromDomain(
        domain.documentType,
      )
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationFormResponsePaymentProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
        >['payment']
      >['proofFile']
    >,
  ): AdmissionApplicationFormResponsePaymentProofFileDto {
    const dto = new AdmissionApplicationFormResponsePaymentProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationFormResponsePaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'PENDING', 'UNPAID'] })
  status!: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'UNPAID'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponsePaymentProofFileDto,
    nullable: true,
  })
  proofFile?: AdmissionApplicationFormResponsePaymentProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
      >['payment']
    >,
  ): AdmissionApplicationFormResponsePaymentDto {
    const dto = new AdmissionApplicationFormResponsePaymentDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = domain.amount
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : AdmissionApplicationFormResponsePaymentProofFileDto.fromDomain(
              domain.proofFile,
            )
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationFormResponseParentsOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
          >['parents']
        >[number]
      >['occupation']
    >,
  ): AdmissionApplicationFormResponseParentsOccupationDto {
    const dto = new AdmissionApplicationFormResponseParentsOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationFormResponseParentsEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
          >['parents']
        >[number]
      >['education']
    >,
  ): AdmissionApplicationFormResponseParentsEducationDto {
    const dto = new AdmissionApplicationFormResponseParentsEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionApplicationFormResponseParentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  nik!: string | null

  @ApiProperty({ type: String, nullable: true })
  birthPlace!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  birthDate!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String, nullable: true })
  occupationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  incomeRangeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  lifeStatusId!: string | null

  @ApiProperty({ type: String, nullable: true })
  domicileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  residenceId!: string | null

  @ApiProperty({ type: Boolean })
  sameAddressAsStudent!: boolean

  @ApiProperty({ type: String, nullable: true })
  street!: string | null

  @ApiProperty({ type: String, nullable: true })
  rt!: string | null

  @ApiProperty({ type: String, nullable: true })
  rw!: string | null

  @ApiProperty({ type: String, nullable: true })
  village!: string | null

  @ApiProperty({ type: String, nullable: true })
  district!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: String, nullable: true })
  province!: string | null

  @ApiProperty({ type: String, nullable: true })
  postalCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({
    type: () => AdmissionApplicationFormResponseParentsOccupationDto,
    nullable: true,
  })
  occupation!: AdmissionApplicationFormResponseParentsOccupationDto | null

  @ApiProperty({
    type: () => AdmissionApplicationFormResponseParentsEducationDto,
    nullable: true,
  })
  education!: AdmissionApplicationFormResponseParentsEducationDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
        >['parents']
      >[number]
    >,
  ): AdmissionApplicationFormResponseParentsDto {
    const dto = new AdmissionApplicationFormResponseParentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.relation = domain.relation
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate =
      domain.birthDate == null
        ? domain.birthDate
        : domain.birthDate.toISOString()
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.incomeRangeId = domain.incomeRangeId
    dto.lifeStatusId = domain.lifeStatusId
    dto.domicileId = domain.domicileId
    dto.residenceId = domain.residenceId
    dto.sameAddressAsStudent = domain.sameAddressAsStudent
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.isPrimary = domain.isPrimary
    dto.occupation =
      domain.occupation == null
        ? domain.occupation
        : AdmissionApplicationFormResponseParentsOccupationDto.fromDomain(
            domain.occupation,
          )
    dto.education =
      domain.education == null
        ? domain.education
        : AdmissionApplicationFormResponseParentsEducationDto.fromDomain(
            domain.education,
          )
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionApplicationFormResponseAchievementsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionApplicationFormResponseAchievementsFileDto {
    const dto = new AdmissionApplicationFormResponseAchievementsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationFormResponseAchievementsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String })
  competitionName!: string

  @ApiProperty({ type: String, nullable: true })
  competitionFieldId!: string | null

  @ApiProperty({ type: String, nullable: true })
  organizer!: string | null

  @ApiProperty({ type: String, nullable: true })
  competitionLevelId!: string | null

  @ApiProperty({ type: String, nullable: true })
  rank!: string | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseAchievementsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationFormResponseAchievementsFileDto | null

  static fromDomain(
    domain: AdmissionAchievementRow,
  ): AdmissionApplicationFormResponseAchievementsDto {
    const dto = new AdmissionApplicationFormResponseAchievementsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.competitionName = domain.competitionName
    dto.competitionFieldId = domain.competitionFieldId
    dto.organizer = domain.organizer
    dto.competitionLevelId = domain.competitionLevelId
    dto.rank = domain.rank
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationFormResponseAchievementsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionApplicationFormResponseScholarshipsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): AdmissionApplicationFormResponseScholarshipsFileDto {
    const dto = new AdmissionApplicationFormResponseScholarshipsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class AdmissionApplicationFormResponseScholarshipsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  scholarshipName!: string

  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null

  @ApiProperty({ type: String, nullable: true })
  providerTypeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  duration!: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  kipNumber?: string | null

  @ApiProperty({ type: Number, nullable: true })
  amount!: number | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseScholarshipsFileDto,
    nullable: true,
  })
  file?: AdmissionApplicationFormResponseScholarshipsFileDto | null

  static fromDomain(
    domain: AdmissionScholarshipRow,
  ): AdmissionApplicationFormResponseScholarshipsDto {
    const dto = new AdmissionApplicationFormResponseScholarshipsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.categoryId = domain.categoryId
    dto.scholarshipName = domain.scholarshipName
    dto.providerName = domain.providerName
    dto.providerTypeId = domain.providerTypeId
    dto.duration = domain.duration
    dto.kipNumber = domain.kipNumber
    dto.amount = domain.amount == null ? null : Number(domain.amount)
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : AdmissionApplicationFormResponseScholarshipsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class AdmissionApplicationFormResponseDto {
  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: String })
  fullName?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseReligionDto,
    nullable: true,
  })
  religion?: AdmissionApplicationFormResponseReligionDto | null

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({ type: () => AdmissionApplicationFormResponseUserDto })
  user?: AdmissionApplicationFormResponseUserDto

  @ApiPropertyOptional({ type: () => AdmissionApplicationFormResponseWaveDto })
  wave?: AdmissionApplicationFormResponseWaveDto

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseDocumentsDto,
    isArray: true,
  })
  documents?: AdmissionApplicationFormResponseDocumentsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponsePaymentDto,
    nullable: true,
  })
  payment?: AdmissionApplicationFormResponsePaymentDto | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseParentsDto,
    isArray: true,
  })
  parents?: AdmissionApplicationFormResponseParentsDto[]

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  hobby?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  aspiration?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  financingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  disabilityTypeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  specialNeedId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  studentResidenceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelDistanceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelTimeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  transportationId?: string | null

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseAchievementsDto,
    isArray: true,
  })
  achievements?: AdmissionApplicationFormResponseAchievementsDto[]

  @ApiPropertyOptional({
    type: () => AdmissionApplicationFormResponseScholarshipsDto,
    isArray: true,
  })
  scholarships?: AdmissionApplicationFormResponseScholarshipsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'VERIFIED',
      'ACCEPTED',
      'ENROLLING',
      'REJECTED',
      'ENROLLED',
    ],
  })
  status!:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'VERIFIED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'REJECTED'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<
      ReturnType<UpdateMyApplicationUseCase['executeForApplication']>
    >,
  ): AdmissionApplicationFormResponseDto {
    const dto = new AdmissionApplicationFormResponseDto()
    dto.userId = domain.userId
    dto.fullName = domain.fullName
    dto.nickname = domain.nickname
    dto.nik = domain.nik
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nisn = domain.nisn
    dto.email = domain.email
    dto.phone = domain.phone
    dto.religionId = domain.religionId
    if (domain.religion !== undefined)
      dto.religion =
        domain.religion == null
          ? domain.religion
          : AdmissionApplicationFormResponseReligionDto.fromDomain(
              domain.religion,
            )
    dto.registrationNumber = domain.registrationNumber
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : AdmissionApplicationFormResponseUserDto.fromDomain(domain.user)
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionApplicationFormResponseWaveDto.fromDomain(domain.wave)
    if (domain.documents !== undefined)
      dto.documents =
        domain.documents == null
          ? domain.documents
          : domain.documents.map((x) =>
              AdmissionApplicationFormResponseDocumentsDto.fromDomain(x),
            )
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : AdmissionApplicationFormResponsePaymentDto.fromDomain(
              domain.payment,
            )
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              AdmissionApplicationFormResponseParentsDto.fromDomain(x),
            )
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.hobby = domain.hobby
    dto.aspiration = domain.aspiration
    dto.financingSourceId = domain.financingSourceId
    dto.disabilityTypeId = domain.disabilityTypeId
    dto.specialNeedId = domain.specialNeedId
    dto.studentResidenceId = domain.studentResidenceId
    dto.travelDistanceId = domain.travelDistanceId
    dto.travelTimeId = domain.travelTimeId
    dto.transportationId = domain.transportationId
    if (domain.achievements !== undefined)
      dto.achievements = domain.achievements.map((x) =>
        AdmissionApplicationFormResponseAchievementsDto.fromDomain(x),
      )
    if (domain.scholarships !== undefined)
      dto.scholarships = domain.scholarships.map((x) =>
        AdmissionApplicationFormResponseScholarshipsDto.fromDomain(x),
      )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class MyAdmissionApplicationResponseDocumentTypesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['documentTypes']
      >[number]
    >,
  ): MyAdmissionApplicationResponseDocumentTypesDto {
    const dto = new MyAdmissionApplicationResponseDocumentTypesDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class MyAdmissionApplicationResponseReligionDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['religion']
    >,
  ): MyAdmissionApplicationResponseReligionDto {
    const dto = new MyAdmissionApplicationResponseReligionDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyAdmissionApplicationResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastLoginAt?: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['user']
    >,
  ): MyAdmissionApplicationResponseUserDto {
    const dto = new MyAdmissionApplicationResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    if (domain.lastLoginAt !== undefined)
      dto.lastLoginAt =
        domain.lastLoginAt == null
          ? domain.lastLoginAt
          : domain.lastLoginAt.toISOString()
    return dto
  }
}

export class MyAdmissionApplicationResponseWaveDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => AdmissionApplicationWaveAcademicYearResponseDto,
    nullable: true,
  })
  academicYear?: AdmissionApplicationWaveAcademicYearResponseDto | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['wave']
    >,
  ): MyAdmissionApplicationResponseWaveDto {
    const dto = new MyAdmissionApplicationResponseWaveDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : AdmissionApplicationWaveAcademicYearResponseDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class MyAdmissionApplicationResponseDocumentsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['documents']
        >[number]
      >['file']
    >,
  ): MyAdmissionApplicationResponseDocumentsFileDto {
    const dto = new MyAdmissionApplicationResponseDocumentsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class MyAdmissionApplicationResponseDocumentsDocumentTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['documents']
        >[number]
      >['documentType']
    >,
  ): MyAdmissionApplicationResponseDocumentsDocumentTypeDto {
    const dto = new MyAdmissionApplicationResponseDocumentsDocumentTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class MyAdmissionApplicationResponseDocumentsDto {
  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseDocumentsFileDto,
    nullable: true,
  })
  file?: MyAdmissionApplicationResponseDocumentsFileDto | null

  @ApiProperty({
    type: () => MyAdmissionApplicationResponseDocumentsDocumentTypeDto,
  })
  documentType!: MyAdmissionApplicationResponseDocumentsDocumentTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fileId?: string | null

  @ApiProperty({ enum: ['REJECTED', 'PENDING', 'APPROVED'] })
  status!: 'REJECTED' | 'PENDING' | 'APPROVED'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['documents']
      >[number]
    >,
  ): MyAdmissionApplicationResponseDocumentsDto {
    const dto = new MyAdmissionApplicationResponseDocumentsDto()
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : MyAdmissionApplicationResponseDocumentsFileDto.fromDomain(
              domain.file,
            )
    dto.documentType =
      MyAdmissionApplicationResponseDocumentsDocumentTypeDto.fromDomain(
        domain.documentType,
      )
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.documentTypeId = domain.documentTypeId
    dto.fileId = domain.fileId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    return dto
  }
}

export class MyAdmissionApplicationResponsePaymentProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['payment']
      >['proofFile']
    >,
  ): MyAdmissionApplicationResponsePaymentProofFileDto {
    const dto = new MyAdmissionApplicationResponsePaymentProofFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class MyAdmissionApplicationResponsePaymentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'PENDING', 'UNPAID'] })
  status!: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'UNPAID'

  @ApiProperty({ type: String, nullable: true })
  proofFileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankAccountId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionPaymentBankAccountDto,
    nullable: true,
  })
  bankAccount?: AdmissionPaymentBankAccountDto | null

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponsePaymentProofFileDto,
    nullable: true,
  })
  proofFile?: MyAdmissionApplicationResponsePaymentProofFileDto | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['payment']
    >,
  ): MyAdmissionApplicationResponsePaymentDto {
    const dto = new MyAdmissionApplicationResponsePaymentDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.amount = domain.amount
    dto.status = domain.status
    dto.proofFileId = domain.proofFileId
    dto.bankAccountId = domain.bankAccountId
    if (domain.bankAccount !== undefined)
      dto.bankAccount =
        domain.bankAccount == null
          ? domain.bankAccount
          : AdmissionPaymentBankAccountDto.fromDomain(domain.bankAccount)
    if (domain.proofFile !== undefined)
      dto.proofFile =
        domain.proofFile == null
          ? domain.proofFile
          : MyAdmissionApplicationResponsePaymentProofFileDto.fromDomain(
              domain.proofFile,
            )
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate =
      domain.transferDate == null
        ? domain.transferDate
        : domain.transferDate.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt =
      domain.verifiedAt == null
        ? domain.verifiedAt
        : domain.verifiedAt.toISOString()
    return dto
  }
}

export class MyAdmissionApplicationResponseParentsOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['parents']
        >[number]
      >['occupation']
    >,
  ): MyAdmissionApplicationResponseParentsOccupationDto {
    const dto = new MyAdmissionApplicationResponseParentsOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyAdmissionApplicationResponseParentsEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['parents']
        >[number]
      >['education']
    >,
  ): MyAdmissionApplicationResponseParentsEducationDto {
    const dto = new MyAdmissionApplicationResponseParentsEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyAdmissionApplicationResponseParentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  nik!: string | null

  @ApiProperty({ type: String, nullable: true })
  birthPlace!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  birthDate!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String, nullable: true })
  occupationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiProperty({ type: String, nullable: true })
  incomeRangeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  lifeStatusId!: string | null

  @ApiProperty({ type: String, nullable: true })
  domicileId!: string | null

  @ApiProperty({ type: String, nullable: true })
  residenceId!: string | null

  @ApiProperty({ type: Boolean })
  sameAddressAsStudent!: boolean

  @ApiProperty({ type: String, nullable: true })
  street!: string | null

  @ApiProperty({ type: String, nullable: true })
  rt!: string | null

  @ApiProperty({ type: String, nullable: true })
  rw!: string | null

  @ApiProperty({ type: String, nullable: true })
  village!: string | null

  @ApiProperty({ type: String, nullable: true })
  district!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: String, nullable: true })
  province!: string | null

  @ApiProperty({ type: String, nullable: true })
  postalCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({
    type: () => MyAdmissionApplicationResponseParentsOccupationDto,
    nullable: true,
  })
  occupation!: MyAdmissionApplicationResponseParentsOccupationDto | null

  @ApiProperty({
    type: () => MyAdmissionApplicationResponseParentsEducationDto,
    nullable: true,
  })
  education!: MyAdmissionApplicationResponseParentsEducationDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMyApplicationUseCase['execute']>>['parents']
      >[number]
    >,
  ): MyAdmissionApplicationResponseParentsDto {
    const dto = new MyAdmissionApplicationResponseParentsDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.relation = domain.relation
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate =
      domain.birthDate == null
        ? domain.birthDate
        : domain.birthDate.toISOString()
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.incomeRangeId = domain.incomeRangeId
    dto.lifeStatusId = domain.lifeStatusId
    dto.domicileId = domain.domicileId
    dto.residenceId = domain.residenceId
    dto.sameAddressAsStudent = domain.sameAddressAsStudent
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.isPrimary = domain.isPrimary
    dto.occupation =
      domain.occupation == null
        ? domain.occupation
        : MyAdmissionApplicationResponseParentsOccupationDto.fromDomain(
            domain.occupation,
          )
    dto.education =
      domain.education == null
        ? domain.education
        : MyAdmissionApplicationResponseParentsEducationDto.fromDomain(
            domain.education,
          )
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class MyAdmissionApplicationResponseAchievementsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): MyAdmissionApplicationResponseAchievementsFileDto {
    const dto = new MyAdmissionApplicationResponseAchievementsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class MyAdmissionApplicationResponseAchievementsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String })
  competitionName!: string

  @ApiProperty({ type: String, nullable: true })
  competitionFieldId!: string | null

  @ApiProperty({ type: String, nullable: true })
  organizer!: string | null

  @ApiProperty({ type: String, nullable: true })
  competitionLevelId!: string | null

  @ApiProperty({ type: String, nullable: true })
  rank!: string | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseAchievementsFileDto,
    nullable: true,
  })
  file?: MyAdmissionApplicationResponseAchievementsFileDto | null

  static fromDomain(
    domain: AdmissionAchievementRow,
  ): MyAdmissionApplicationResponseAchievementsDto {
    const dto = new MyAdmissionApplicationResponseAchievementsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.competitionName = domain.competitionName
    dto.competitionFieldId = domain.competitionFieldId
    dto.organizer = domain.organizer
    dto.competitionLevelId = domain.competitionLevelId
    dto.rank = domain.rank
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : MyAdmissionApplicationResponseAchievementsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class MyAdmissionApplicationResponseScholarshipsFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: AdmissionFileRef,
  ): MyAdmissionApplicationResponseScholarshipsFileDto {
    const dto = new MyAdmissionApplicationResponseScholarshipsFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class MyAdmissionApplicationResponseScholarshipsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  scholarshipName!: string

  @ApiProperty({ type: String, nullable: true })
  providerName!: string | null

  @ApiProperty({ type: String, nullable: true })
  providerTypeId!: string | null

  @ApiProperty({ type: String, nullable: true })
  duration!: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  kipNumber?: string | null

  @ApiProperty({ type: Number, nullable: true })
  amount!: number | null

  @ApiProperty({ type: String, nullable: true })
  fileId!: string | null

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseScholarshipsFileDto,
    nullable: true,
  })
  file?: MyAdmissionApplicationResponseScholarshipsFileDto | null

  static fromDomain(
    domain: AdmissionScholarshipRow,
  ): MyAdmissionApplicationResponseScholarshipsDto {
    const dto = new MyAdmissionApplicationResponseScholarshipsDto()
    dto.id = domain.id
    dto.sortOrder = domain.sortOrder
    dto.year = domain.year
    dto.categoryId = domain.categoryId
    dto.scholarshipName = domain.scholarshipName
    dto.providerName = domain.providerName
    dto.providerTypeId = domain.providerTypeId
    dto.duration = domain.duration
    dto.kipNumber = domain.kipNumber
    dto.amount = domain.amount == null ? null : Number(domain.amount)
    dto.fileId = domain.fileId
    if (domain.file !== undefined)
      dto.file =
        domain.file == null
          ? domain.file
          : MyAdmissionApplicationResponseScholarshipsFileDto.fromDomain(
              domain.file,
            )
    return dto
  }
}

export class MyAdmissionApplicationResponseDto {
  @ApiProperty({
    type: () => MyAdmissionApplicationResponseDocumentTypesDto,
    isArray: true,
  })
  documentTypes!: MyAdmissionApplicationResponseDocumentTypesDto[]

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: String })
  fullName?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  gender?: 'MALE' | 'FEMALE' | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  religionId?: string | null

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseReligionDto,
    nullable: true,
  })
  religion?: MyAdmissionApplicationResponseReligionDto | null

  @ApiPropertyOptional({ type: String })
  registrationNumber?: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  childOrder?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  siblingCount?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolName?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolNpsn?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousSchoolAddress?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  graduationYear?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revisionNote?: string | null

  @ApiPropertyOptional({ type: () => MyAdmissionApplicationResponseUserDto })
  user?: MyAdmissionApplicationResponseUserDto

  @ApiPropertyOptional({ type: () => MyAdmissionApplicationResponseWaveDto })
  wave?: MyAdmissionApplicationResponseWaveDto

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseDocumentsDto,
    isArray: true,
  })
  documents?: MyAdmissionApplicationResponseDocumentsDto[]

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponsePaymentDto,
    nullable: true,
  })
  payment?: MyAdmissionApplicationResponsePaymentDto | null

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseParentsDto,
    isArray: true,
  })
  parents?: MyAdmissionApplicationResponseParentsDto[]

  @ApiPropertyOptional({ type: String, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  hobby?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  aspiration?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  financingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  disabilityTypeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  specialNeedId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  studentResidenceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelDistanceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  travelTimeId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  transportationId?: string | null

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseAchievementsDto,
    isArray: true,
  })
  achievements?: MyAdmissionApplicationResponseAchievementsDto[]

  @ApiPropertyOptional({
    type: () => MyAdmissionApplicationResponseScholarshipsDto,
    isArray: true,
  })
  scholarships?: MyAdmissionApplicationResponseScholarshipsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  applicantId?: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({
    enum: [
      'DRAFT',
      'SUBMITTED',
      'REVISION_NEEDED',
      'VERIFIED',
      'ACCEPTED',
      'ENROLLING',
      'REJECTED',
      'ENROLLED',
    ],
  })
  status!:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'REVISION_NEEDED'
    | 'VERIFIED'
    | 'ACCEPTED'
    | 'ENROLLING'
    | 'REJECTED'
    | 'ENROLLED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  verifiedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  verifiedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decidedById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionNote?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  enrolledStudentId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  enrolledAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<GetMyApplicationUseCase['execute']>>,
  ): MyAdmissionApplicationResponseDto {
    const dto = new MyAdmissionApplicationResponseDto()
    dto.documentTypes = domain.documentTypes.map((x) =>
      MyAdmissionApplicationResponseDocumentTypesDto.fromDomain(x),
    )
    dto.userId = domain.userId
    dto.fullName = domain.fullName
    dto.nickname = domain.nickname
    dto.nik = domain.nik
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.nisn = domain.nisn
    dto.email = domain.email
    dto.phone = domain.phone
    dto.religionId = domain.religionId
    if (domain.religion !== undefined)
      dto.religion =
        domain.religion == null
          ? domain.religion
          : MyAdmissionApplicationResponseReligionDto.fromDomain(
              domain.religion,
            )
    dto.registrationNumber = domain.registrationNumber
    dto.childOrder = domain.childOrder
    dto.siblingCount = domain.siblingCount
    dto.previousSchoolName = domain.previousSchoolName
    dto.previousSchoolNpsn = domain.previousSchoolNpsn
    dto.previousSchoolAddress = domain.previousSchoolAddress
    dto.graduationYear = domain.graduationYear
    dto.revisionNote = domain.revisionNote
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyAdmissionApplicationResponseUserDto.fromDomain(domain.user)
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : MyAdmissionApplicationResponseWaveDto.fromDomain(domain.wave)
    if (domain.documents !== undefined)
      dto.documents =
        domain.documents == null
          ? domain.documents
          : domain.documents.map((x) =>
              MyAdmissionApplicationResponseDocumentsDto.fromDomain(x),
            )
    if (domain.payment !== undefined)
      dto.payment =
        domain.payment == null
          ? domain.payment
          : MyAdmissionApplicationResponsePaymentDto.fromDomain(domain.payment)
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              MyAdmissionApplicationResponseParentsDto.fromDomain(x),
            )
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.postalCode = domain.postalCode
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.hobby = domain.hobby
    dto.aspiration = domain.aspiration
    dto.financingSourceId = domain.financingSourceId
    dto.disabilityTypeId = domain.disabilityTypeId
    dto.specialNeedId = domain.specialNeedId
    dto.studentResidenceId = domain.studentResidenceId
    dto.travelDistanceId = domain.travelDistanceId
    dto.travelTimeId = domain.travelTimeId
    dto.transportationId = domain.transportationId
    if (domain.achievements !== undefined)
      dto.achievements = domain.achievements.map((x) =>
        MyAdmissionApplicationResponseAchievementsDto.fromDomain(x),
      )
    if (domain.scholarships !== undefined)
      dto.scholarships = domain.scholarships.map((x) =>
        MyAdmissionApplicationResponseScholarshipsDto.fromDomain(x),
      )
    dto.id = domain.id
    dto.applicantId = domain.applicantId
    dto.waveId = domain.waveId
    dto.status = domain.status
    if (domain.submittedAt !== undefined)
      dto.submittedAt =
        domain.submittedAt == null
          ? domain.submittedAt
          : domain.submittedAt.toISOString()
    dto.verifiedById = domain.verifiedById
    if (domain.verifiedAt !== undefined)
      dto.verifiedAt =
        domain.verifiedAt == null
          ? domain.verifiedAt
          : domain.verifiedAt.toISOString()
    dto.decidedById = domain.decidedById
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionNote = domain.decisionNote
    dto.enrolledStudentId = domain.enrolledStudentId
    if (domain.enrolledAt !== undefined)
      dto.enrolledAt =
        domain.enrolledAt == null
          ? domain.enrolledAt
          : domain.enrolledAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionActiveWavesResponseWavesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  academicYear!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  remainingQuota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetActiveWavesUseCase['execute']>>['waves']
      >[number]
    >,
  ): AdmissionActiveWavesResponseWavesDto {
    const dto = new AdmissionActiveWavesResponseWavesDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.code = domain.code
    dto.academicYear = domain.academicYear
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.remainingQuota = domain.remainingQuota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    return dto
  }
}

export class AdmissionActiveWavesResponseDocumentTypesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetActiveWavesUseCase['execute']>>['documentTypes']
      >[number]
    >,
  ): AdmissionActiveWavesResponseDocumentTypesDto {
    const dto = new AdmissionActiveWavesResponseDocumentTypesDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    return dto
  }
}

export class AdmissionActiveWavesResponseDto {
  @ApiProperty({
    type: () => AdmissionActiveWavesResponseWavesDto,
    isArray: true,
  })
  waves!: AdmissionActiveWavesResponseWavesDto[]

  @ApiProperty({
    type: () => AdmissionActiveWavesResponseDocumentTypesDto,
    isArray: true,
  })
  documentTypes!: AdmissionActiveWavesResponseDocumentTypesDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetActiveWavesUseCase['execute']>>,
  ): AdmissionActiveWavesResponseDto {
    const dto = new AdmissionActiveWavesResponseDto()
    dto.waves = domain.waves.map((x) =>
      AdmissionActiveWavesResponseWavesDto.fromDomain(x),
    )
    dto.documentTypes = domain.documentTypes.map((x) =>
      AdmissionActiveWavesResponseDocumentTypesDto.fromDomain(x),
    )
    return dto
  }
}
