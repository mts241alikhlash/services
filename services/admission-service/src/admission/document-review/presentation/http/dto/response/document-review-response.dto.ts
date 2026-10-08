import { ApiProperty } from '@nestjs/swagger'
import type { DocumentSummary } from '../../../../domain/policies/document-summary.policy.js'
import type {
  ReviewDocument,
  ReviewDocumentSlot,
} from '../../../../domain/entities/document-review.entity.js'

export class AdmissionDocumentReviewFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: String })
  storageKey!: string
}

export class AdmissionDocumentReviewDocumentResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED'

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  @ApiProperty({ type: () => AdmissionDocumentReviewFileDto })
  file!: AdmissionDocumentReviewFileDto

  static fromDomain(
    domain: ReviewDocument,
  ): AdmissionDocumentReviewDocumentResponseDto {
    const dto = new AdmissionDocumentReviewDocumentResponseDto()
    dto.id = domain.id
    dto.documentTypeId = domain.documentTypeId
    dto.status = domain.status as typeof dto.status
    dto.note = domain.note
    dto.verifiedAt = domain.verifiedAt?.toISOString() ?? null
    dto.file = {
      id: domain.file.id,
      originalName: domain.file.originalName,
      mimeType: domain.file.mimeType,
      storageKey: domain.file.storageKey,
    }
    return dto
  }
}

export class AdmissionDocumentReviewSlotDto {
  @ApiProperty({ type: String })
  documentTypeId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({
    type: () => AdmissionDocumentReviewDocumentResponseDto,
    nullable: true,
  })
  document!: AdmissionDocumentReviewDocumentResponseDto | null

  static fromDomain(
    domain: ReviewDocumentSlot,
  ): AdmissionDocumentReviewSlotDto {
    const dto = new AdmissionDocumentReviewSlotDto()
    dto.documentTypeId = domain.documentTypeId
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.document = domain.document
      ? AdmissionDocumentReviewDocumentResponseDto.fromDomain(domain.document)
      : null
    return dto
  }
}

export class AdmissionDocumentReviewResponseDto {
  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  registrationNumber!: string

  @ApiProperty({ type: String })
  applicantName!: string

  @ApiProperty({ type: String })
  waveName!: string

  @ApiProperty({ type: String })
  status!: string

  @ApiProperty({ type: String, nullable: true })
  revisionNote!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  paymentStatus!: string | null

  @ApiProperty({ type: Boolean })
  readOnly!: boolean

  @ApiProperty({ type: () => [AdmissionDocumentReviewSlotDto] })
  slots!: AdmissionDocumentReviewSlotDto[]

  static fromDomain(domain: {
    applicationId: string
    registrationNumber: string
    applicantName: string
    waveName: string
    status: string
    revisionNote: string | null
    submittedAt: Date | null
    paymentStatus: string | null
    readOnly: boolean
    slots: ReviewDocumentSlot[]
  }): AdmissionDocumentReviewResponseDto {
    const dto = new AdmissionDocumentReviewResponseDto()
    dto.applicationId = domain.applicationId
    dto.registrationNumber = domain.registrationNumber
    dto.applicantName = domain.applicantName
    dto.waveName = domain.waveName
    dto.status = domain.status
    dto.revisionNote = domain.revisionNote
    dto.submittedAt = domain.submittedAt?.toISOString() ?? null
    dto.paymentStatus = domain.paymentStatus
    dto.readOnly = domain.readOnly
    dto.slots = domain.slots.map((slot) =>
      AdmissionDocumentReviewSlotDto.fromDomain(slot),
    )
    return dto
  }
}

export class AdmissionDocumentReviewSummaryDto {
  @ApiProperty({ type: Number })
  approved!: number

  @ApiProperty({ type: Number })
  rejected!: number

  @ApiProperty({ type: Number })
  pending!: number

  @ApiProperty({ type: Number })
  missing!: number

  @ApiProperty({ type: Number })
  total!: number
}

export class AdmissionDocumentReviewRowResponseDto {
  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  registrationNumber!: string

  @ApiProperty({ type: String })
  applicantName!: string

  @ApiProperty({ type: String })
  waveName!: string

  @ApiProperty({ type: String })
  status!: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: string | null

  @ApiProperty({ type: () => AdmissionDocumentReviewSummaryDto })
  summary!: AdmissionDocumentReviewSummaryDto

  static fromDomain(domain: {
    applicationId: string
    registrationNumber: string
    applicantName: string
    waveName: string
    status: string
    submittedAt: Date | null
    summary: DocumentSummary
  }): AdmissionDocumentReviewRowResponseDto {
    const dto = new AdmissionDocumentReviewRowResponseDto()
    dto.applicationId = domain.applicationId
    dto.registrationNumber = domain.registrationNumber
    dto.applicantName = domain.applicantName
    dto.waveName = domain.waveName
    dto.status = domain.status
    dto.submittedAt = domain.submittedAt?.toISOString() ?? null
    dto.summary = domain.summary
    return dto
  }
}

export class AdmissionDocumentReviewCountsDto {
  @ApiProperty({ type: Number })
  waiting!: number

  @ApiProperty({ type: Number })
  revision!: number

  @ApiProperty({ type: Number })
  done!: number
}

export class AdmissionDocumentReviewMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  @ApiProperty({ type: () => AdmissionDocumentReviewCountsDto })
  counts!: AdmissionDocumentReviewCountsDto
}

export class AdmissionDocumentReviewQueueResponseDto {
  @ApiProperty({ type: () => [AdmissionDocumentReviewRowResponseDto] })
  data!: AdmissionDocumentReviewRowResponseDto[]

  @ApiProperty({ type: () => AdmissionDocumentReviewMetaDto })
  meta!: AdmissionDocumentReviewMetaDto

  static fromDomain(domain: {
    data: Parameters<
      typeof AdmissionDocumentReviewRowResponseDto.fromDomain
    >[0][]
    meta: AdmissionDocumentReviewMetaDto
  }): AdmissionDocumentReviewQueueResponseDto {
    const dto = new AdmissionDocumentReviewQueueResponseDto()
    dto.data = domain.data.map((row) =>
      AdmissionDocumentReviewRowResponseDto.fromDomain(row),
    )
    dto.meta = domain.meta
    return dto
  }
}

export class AdmissionDocumentReviewSendResponseDto {
  @ApiProperty({ enum: ['SUBMITTED', 'REVISION_NEEDED', 'VERIFIED'] })
  status!: 'SUBMITTED' | 'REVISION_NEEDED' | 'VERIFIED'

  @ApiProperty({ enum: ['APPROVED', 'REVISION_REQUESTED'] })
  outcome!: 'APPROVED' | 'REVISION_REQUESTED'

  @ApiProperty({ type: Boolean })
  verified!: boolean

  static fromDomain(domain: {
    status: 'SUBMITTED' | 'REVISION_NEEDED' | 'VERIFIED'
    outcome: 'APPROVED' | 'REVISION_REQUESTED'
    verified: boolean
  }): AdmissionDocumentReviewSendResponseDto {
    const dto = new AdmissionDocumentReviewSendResponseDto()
    dto.status = domain.status
    dto.outcome = domain.outcome
    dto.verified = domain.verified
    return dto
  }
}
