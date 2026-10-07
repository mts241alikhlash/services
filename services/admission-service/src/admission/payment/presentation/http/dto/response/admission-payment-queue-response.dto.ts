import { ApiProperty } from '@nestjs/swagger'

export class AdmissionPaymentQueueBankAccountDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  bankName!: string

  @ApiProperty({ type: String })
  accountNumber!: string

  @ApiProperty({ type: String })
  accountHolder!: string
}

export class AdmissionPaymentQueueProofFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: String })
  storageKey!: string
}

export class AdmissionPaymentQueueRowResponseDto {
  @ApiProperty({ type: String })
  paymentId!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  registrationNumber!: string

  @ApiProperty({ type: String })
  applicantName!: string

  @ApiProperty({ type: String })
  applicationStatus!: string

  @ApiProperty({ type: String })
  waveId!: string

  @ApiProperty({ type: String })
  waveName!: string

  @ApiProperty({ type: Number })
  amount!: number

  @ApiProperty({ enum: ['UNPAID', 'PENDING', 'VERIFIED', 'REJECTED'] })
  status!: 'UNPAID' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  bankName!: string | null

  @ApiProperty({ type: String, nullable: true })
  senderAccountName!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  transferDate!: string | null

  @ApiProperty({
    type: () => AdmissionPaymentQueueBankAccountDto,
    nullable: true,
  })
  bankAccount!: AdmissionPaymentQueueBankAccountDto | null

  @ApiProperty({
    type: () => AdmissionPaymentQueueProofFileDto,
    nullable: true,
  })
  proofFile!: AdmissionPaymentQueueProofFileDto | null

  @ApiProperty({ type: Boolean })
  proofUploadedByStaff!: boolean

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: {
    paymentId: string
    applicationId: string
    registrationNumber: string
    applicantName: string
    applicationStatus: string
    waveId: string
    waveName: string
    amount: number
    status: 'UNPAID' | 'PENDING' | 'VERIFIED' | 'REJECTED'
    note: string | null
    bankName: string | null
    senderAccountName: string | null
    transferDate: Date | null
    bankAccount: AdmissionPaymentQueueBankAccountDto | null
    proofFile: {
      id: string
      originalName: string
      mimeType: string
      storageKey: string
    } | null
    proofUploadedByStaff: boolean
    verifiedById: string | null
    verifiedAt: Date | null
    updatedAt: Date
  }): AdmissionPaymentQueueRowResponseDto {
    const dto = new AdmissionPaymentQueueRowResponseDto()
    dto.paymentId = domain.paymentId
    dto.applicationId = domain.applicationId
    dto.registrationNumber = domain.registrationNumber
    dto.applicantName = domain.applicantName
    dto.applicationStatus = domain.applicationStatus
    dto.waveId = domain.waveId
    dto.waveName = domain.waveName
    dto.amount = domain.amount
    dto.status = domain.status
    dto.note = domain.note
    dto.bankName = domain.bankName
    dto.senderAccountName = domain.senderAccountName
    dto.transferDate = domain.transferDate?.toISOString() ?? null
    dto.bankAccount = domain.bankAccount
    dto.proofFile = domain.proofFile && {
      id: domain.proofFile.id,
      originalName: domain.proofFile.originalName,
      mimeType: domain.proofFile.mimeType,
      storageKey: domain.proofFile.storageKey,
    }
    dto.proofUploadedByStaff = domain.proofUploadedByStaff
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt = domain.verifiedAt?.toISOString() ?? null
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionPaymentQueueCountsDto {
  @ApiProperty({ type: Number })
  pending!: number

  @ApiProperty({ type: Number })
  verified!: number

  @ApiProperty({ type: Number })
  rejected!: number
}

export class AdmissionPaymentQueueMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  @ApiProperty({ type: () => AdmissionPaymentQueueCountsDto })
  counts!: AdmissionPaymentQueueCountsDto
}

export class AdmissionPaymentQueueResponseDto {
  @ApiProperty({ type: () => [AdmissionPaymentQueueRowResponseDto] })
  data!: AdmissionPaymentQueueRowResponseDto[]

  @ApiProperty({ type: () => AdmissionPaymentQueueMetaDto })
  meta!: AdmissionPaymentQueueMetaDto

  static fromDomain(domain: {
    data: Parameters<typeof AdmissionPaymentQueueRowResponseDto.fromDomain>[0][]
    meta: AdmissionPaymentQueueMetaDto
  }): AdmissionPaymentQueueResponseDto {
    const dto = new AdmissionPaymentQueueResponseDto()
    dto.data = domain.data.map((row) =>
      AdmissionPaymentQueueRowResponseDto.fromDomain(row),
    )
    dto.meta = domain.meta
    return dto
  }
}

export class AdmissionEligibleApplicationResponseDto {
  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ type: String })
  registrationNumber!: string

  @ApiProperty({ type: String })
  applicantName!: string

  @ApiProperty({ type: String })
  applicationStatus!: string

  @ApiProperty({ type: String })
  waveName!: string

  @ApiProperty({ type: Number })
  amount!: number
}

export class AdmissionEligibleApplicationListResponseDto {
  @ApiProperty({ type: () => [AdmissionEligibleApplicationResponseDto] })
  data!: AdmissionEligibleApplicationResponseDto[]

  static fromDomain(domain: {
    data: AdmissionEligibleApplicationResponseDto[]
  }): AdmissionEligibleApplicationListResponseDto {
    const dto = new AdmissionEligibleApplicationListResponseDto()
    dto.data = domain.data.map((row) => {
      const item = new AdmissionEligibleApplicationResponseDto()
      item.applicationId = row.applicationId
      item.registrationNumber = row.registrationNumber
      item.applicantName = row.applicantName
      item.applicationStatus = row.applicationStatus
      item.waveName = row.waveName
      item.amount = row.amount
      return item
    })
    return dto
  }
}

export class AdmissionPaymentDecisionResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  applicationId!: string

  @ApiProperty({ enum: ['UNPAID', 'PENDING', 'VERIFIED', 'REJECTED'] })
  status!: 'UNPAID' | 'PENDING' | 'VERIFIED' | 'REJECTED'

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  verifiedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  verifiedAt!: string | null

  static fromDomain(domain: {
    id: string
    applicationId: string
    status: 'UNPAID' | 'PENDING' | 'VERIFIED' | 'REJECTED'
    note: string | null
    verifiedById: string | null
    verifiedAt: Date | null
  }): AdmissionPaymentDecisionResponseDto {
    const dto = new AdmissionPaymentDecisionResponseDto()
    dto.id = domain.id
    dto.applicationId = domain.applicationId
    dto.status = domain.status
    dto.note = domain.note
    dto.verifiedById = domain.verifiedById
    dto.verifiedAt = domain.verifiedAt?.toISOString() ?? null
    return dto
  }
}
