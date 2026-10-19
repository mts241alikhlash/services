import { ApiProperty } from '@nestjs/swagger'
import type { LateDocumentRow } from '../../../../domain/late-document.entity.js'

export class AdmissionLateDocumentRowResponseDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ type: String }) registrationNumber!: string
  @ApiProperty({ type: String }) applicantName!: string
  @ApiProperty({ type: String }) applicationStatus!: string
  @ApiProperty({ type: String }) waveName!: string
  @ApiProperty({ type: Number, nullable: true }) gradeLevel!: number | null
  @ApiProperty({ type: String }) documentTypeId!: string
  @ApiProperty({ type: String }) documentTypeName!: string
  @ApiProperty({ type: String, nullable: true }) documentId!: string | null
  @ApiProperty({ type: String, nullable: true }) fileId!: string | null
  @ApiProperty({ enum: ['MISSING', 'PENDING', 'REJECTED', 'APPROVED'] })
  state!: 'MISSING' | 'PENDING' | 'REJECTED' | 'APPROVED'
  @ApiProperty({ enum: ['ON_TIME', 'LATE', 'OVERDUE'] })
  urgency!: 'ON_TIME' | 'LATE' | 'OVERDUE'
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  limitDate!: string | null
  @ApiProperty({ type: String, nullable: true }) note!: string | null

  static fromDomain(
    domain: LateDocumentRow,
  ): AdmissionLateDocumentRowResponseDto {
    const dto = new AdmissionLateDocumentRowResponseDto()
    dto.applicationId = domain.applicationId
    dto.registrationNumber = domain.registrationNumber
    dto.applicantName = domain.applicantName
    dto.applicationStatus = domain.applicationStatus
    dto.waveName = domain.waveName
    dto.gradeLevel = domain.gradeLevel
    dto.documentTypeId = domain.documentTypeId
    dto.documentTypeName = domain.documentTypeName
    dto.documentId = domain.documentId
    dto.fileId = domain.fileId
    dto.state = domain.state
    dto.urgency = domain.urgency
    dto.limitDate = domain.limitDate?.toISOString() ?? null
    dto.note = domain.note
    return dto
  }
}

export class AdmissionLateDocumentYearDto {
  @ApiProperty({ type: String }) id!: string
  @ApiProperty({ type: String, nullable: true }) name!: string | null
}

export class AdmissionLateDocumentCountsDto {
  @ApiProperty({ type: Number }) onTime!: number
  @ApiProperty({ type: Number }) late!: number
  @ApiProperty({ type: Number }) overdue!: number
  @ApiProperty({ type: Number }) complete!: number
}

export class AdmissionLateDocumentMetaDto {
  @ApiProperty({ type: Number }) page!: number
  @ApiProperty({ type: Number }) limit!: number
  @ApiProperty({ type: Number }) total!: number
  @ApiProperty({ type: Number }) totalPages!: number
  @ApiProperty({ type: () => AdmissionLateDocumentYearDto, nullable: true })
  year!: AdmissionLateDocumentYearDto | null
  @ApiProperty({ type: [String], enum: ['start', 'end'] })
  datesMissing!: ('start' | 'end')[]
  @ApiProperty({ type: () => AdmissionLateDocumentCountsDto })
  counts!: AdmissionLateDocumentCountsDto
}

export class AdmissionLateDocumentListResponseDto {
  @ApiProperty({ type: () => [AdmissionLateDocumentRowResponseDto] })
  data!: AdmissionLateDocumentRowResponseDto[]

  @ApiProperty({ type: () => AdmissionLateDocumentMetaDto })
  meta!: AdmissionLateDocumentMetaDto

  static fromDomain(domain: {
    data: LateDocumentRow[]
    meta: AdmissionLateDocumentMetaDto
  }): AdmissionLateDocumentListResponseDto {
    const dto = new AdmissionLateDocumentListResponseDto()
    dto.data = domain.data.map((row) =>
      AdmissionLateDocumentRowResponseDto.fromDomain(row),
    )
    dto.meta = domain.meta
    return dto
  }
}

export class AdmissionLateDocumentSavedResponseDto {
  @ApiProperty({ type: String }) id!: string
  @ApiProperty({ type: String }) documentTypeId!: string
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: string
  @ApiProperty({ type: String, nullable: true }) note!: string | null
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(domain: {
    id: string
    documentTypeId: string
    status: string
    note?: string | null
    verifiedAt?: Date | null
  }): AdmissionLateDocumentSavedResponseDto {
    const dto = new AdmissionLateDocumentSavedResponseDto()
    dto.id = domain.id
    dto.documentTypeId = domain.documentTypeId
    dto.status = domain.status
    dto.note = domain.note ?? null
    dto.verifiedAt = domain.verifiedAt?.toISOString() ?? null
    return dto
  }
}
