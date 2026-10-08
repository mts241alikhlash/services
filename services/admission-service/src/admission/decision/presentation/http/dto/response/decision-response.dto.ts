import { ApiProperty } from '@nestjs/swagger'
import type { DocumentSummary } from '../../../../../document-review/index.js'

export class AdmissionDecisionSummaryDto {
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

export class AdmissionDecisionRowResponseDto {
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

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  decidedAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  decisionNote!: string | null

  @ApiProperty({ type: String, nullable: true })
  paymentStatus!: string | null

  @ApiProperty({ type: () => AdmissionDecisionSummaryDto })
  summary!: AdmissionDecisionSummaryDto

  static fromDomain(domain: {
    applicationId: string
    registrationNumber: string
    applicantName: string
    waveName: string
    status: string
    submittedAt: Date | null
    verifiedAt: Date | null
    decidedAt: Date | null
    decisionNote: string | null
    paymentStatus: string | null
    summary: DocumentSummary
  }): AdmissionDecisionRowResponseDto {
    const dto = new AdmissionDecisionRowResponseDto()
    dto.applicationId = domain.applicationId
    dto.registrationNumber = domain.registrationNumber
    dto.applicantName = domain.applicantName
    dto.waveName = domain.waveName
    dto.status = domain.status
    dto.submittedAt = domain.submittedAt?.toISOString() ?? null
    dto.verifiedAt = domain.verifiedAt?.toISOString() ?? null
    dto.decidedAt = domain.decidedAt?.toISOString() ?? null
    dto.decisionNote = domain.decisionNote
    dto.paymentStatus = domain.paymentStatus
    dto.summary = domain.summary
    return dto
  }
}

export class AdmissionDecisionCountsDto {
  @ApiProperty({ type: Number })
  waiting!: number

  @ApiProperty({ type: Number })
  accepted!: number

  @ApiProperty({ type: Number })
  rejected!: number
}

export class AdmissionDecisionMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  @ApiProperty({ type: () => AdmissionDecisionCountsDto })
  counts!: AdmissionDecisionCountsDto
}

export class AdmissionDecisionQueueResponseDto {
  @ApiProperty({ type: () => [AdmissionDecisionRowResponseDto] })
  data!: AdmissionDecisionRowResponseDto[]

  @ApiProperty({ type: () => AdmissionDecisionMetaDto })
  meta!: AdmissionDecisionMetaDto

  static fromDomain(domain: {
    data: Parameters<typeof AdmissionDecisionRowResponseDto.fromDomain>[0][]
    meta: AdmissionDecisionMetaDto
  }): AdmissionDecisionQueueResponseDto {
    const dto = new AdmissionDecisionQueueResponseDto()
    dto.data = domain.data.map((row) =>
      AdmissionDecisionRowResponseDto.fromDomain(row),
    )
    dto.meta = domain.meta
    return dto
  }
}

export class AdmissionDecisionResponseDto {
  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  status!: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  decidedAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  decisionNote!: string | null

  @ApiProperty({ type: Boolean, required: false })
  verified?: boolean

  static fromDomain(domain: {
    applicationId?: string
    id?: string
    status: string
    decidedAt?: Date | string | null
    decisionNote?: string | null
    verified?: boolean
  }): AdmissionDecisionResponseDto {
    const dto = new AdmissionDecisionResponseDto()
    dto.applicationId = (domain.applicationId ?? domain.id)!
    dto.status = domain.status
    const decidedAt = domain.decidedAt
    dto.decidedAt =
      decidedAt instanceof Date ? decidedAt.toISOString() : (decidedAt ?? null)
    dto.decisionNote = domain.decisionNote ?? null
    if (domain.verified !== undefined) dto.verified = domain.verified
    return dto
  }
}

export class AdmissionDecisionManyResultDto {
  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['ACCEPTED', 'SKIPPED'] })
  outcome!: 'ACCEPTED' | 'SKIPPED'

  @ApiProperty({ type: String, required: false })
  reason?: string
}

export class AdmissionDecisionManyResponseDto {
  @ApiProperty({ type: () => [AdmissionDecisionManyResultDto] })
  results!: AdmissionDecisionManyResultDto[]

  static fromDomain(domain: {
    results: {
      applicationId: string
      outcome: 'ACCEPTED' | 'SKIPPED'
      reason?: string
    }[]
  }): AdmissionDecisionManyResponseDto {
    const dto = new AdmissionDecisionManyResponseDto()
    dto.results = domain.results.map((result) => {
      const item = new AdmissionDecisionManyResultDto()
      item.applicationId = result.applicationId
      item.outcome = result.outcome
      if (result.reason) item.reason = result.reason
      return item
    })
    return dto
  }
}
