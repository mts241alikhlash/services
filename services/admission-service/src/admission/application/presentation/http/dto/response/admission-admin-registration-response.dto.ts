import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisteredApplicantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'PSB-2026-0001' })
  registrationNumber!: string

  @ApiProperty({ example: 'ahmad@example.com' })
  identifier!: string
}

export class ApplicationDocumentTypeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'KK' })
  code!: string

  @ApiProperty({ example: 'Kartu Keluarga' })
  name!: string

  @ApiProperty({ example: true })
  isRequired!: boolean

  @ApiProperty({ example: 1 })
  sortOrder!: number

  @ApiProperty({ example: true })
  isActive!: boolean
}

export class ApplicationFileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: '1758000000000-kk.png' })
  filename!: string

  @ApiProperty({ example: 'kk.png' })
  originalName!: string

  @ApiProperty({ example: 'image/png' })
  mimeType!: string

  @ApiProperty({ example: 204800 })
  sizeBytes!: number

  @ApiProperty({ example: 'documents/Kartu Keluarga/1758000000000-kk.png' })
  storageKey!: string
}

export class ApplicationDocumentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  applicationId!: string

  @ApiProperty({ format: 'uuid' })
  documentTypeId!: string

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  status!: string

  @ApiPropertyOptional({ example: null, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  verifiedAt?: Date | null

  @ApiProperty({ type: ApplicationDocumentTypeResponseDto })
  documentType!: ApplicationDocumentTypeResponseDto

  @ApiPropertyOptional({ type: ApplicationFileResponseDto, nullable: true })
  file?: ApplicationFileResponseDto | null
}

export class ApplicationPaymentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  applicationId!: string

  @ApiProperty({ example: 250000 })
  amount!: number

  @ApiPropertyOptional({ example: 'BSI', nullable: true })
  bankName?: string | null

  @ApiPropertyOptional({ example: 'Ahmad Fauzi', nullable: true })
  senderAccountName?: string | null

  @ApiPropertyOptional({ example: '2026-07-01', nullable: true })
  transferDate?: Date | null

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  proofFileId?: string | null

  @ApiProperty({
    example: 'UNPAID',
    enum: ['UNPAID', 'PENDING', 'VERIFIED', 'REJECTED'],
  })
  status!: string

  @ApiPropertyOptional({ example: null, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: ApplicationFileResponseDto, nullable: true })
  proofFile?: ApplicationFileResponseDto | null
}

export class ApplicationParentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'FATHER', enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: string

  @ApiProperty({ example: 'Budi Santoso' })
  name!: string

  @ApiPropertyOptional({ example: null, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  phone?: string | null

  @ApiProperty({ example: true })
  isPrimary!: boolean
}

export class ApplicationWaveResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'Gelombang 1' })
  name!: string

  @ApiProperty({ example: 'GEL-1' })
  code!: string

  @ApiProperty({ example: 250000 })
  registrationFee!: number
}

export class ApplicationDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  userId!: string

  @ApiProperty({ format: 'uuid' })
  waveId!: string

  @ApiProperty({ example: 'PSB-2026-0001' })
  registrationNumber!: string

  @ApiProperty({ example: 'DRAFT' })
  status!: string

  @ApiProperty({ example: 'Ahmad Fauzi' })
  fullName!: string

  @ApiPropertyOptional({ example: null, nullable: true })
  nickname?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  gender?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  birthDate?: Date | null

  @ApiPropertyOptional({ example: null, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  nisn?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  street?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  rt?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  rw?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  village?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  district?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  city?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  province?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  postalCode?: string | null

  @ApiPropertyOptional({ example: null, nullable: true })
  submittedAt?: Date | null

  @ApiPropertyOptional({ example: null, nullable: true })
  revisionNote?: string | null

  @ApiProperty({ type: ApplicationWaveResponseDto })
  wave!: ApplicationWaveResponseDto

  @ApiProperty({ type: [ApplicationParentResponseDto] })
  parents!: ApplicationParentResponseDto[]

  @ApiProperty({ type: [ApplicationDocumentResponseDto] })
  documents!: ApplicationDocumentResponseDto[]

  @ApiPropertyOptional({
    type: ApplicationPaymentResponseDto,
    nullable: true,
  })
  payment?: ApplicationPaymentResponseDto | null

  @ApiPropertyOptional({ type: [ApplicationDocumentTypeResponseDto] })
  documentTypes?: ApplicationDocumentTypeResponseDto[]
}
