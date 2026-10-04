import type { ScanWithDevice } from '../../domain/interfaces/scan-repository.interface.js'
import type { GetScansUseCase } from '../../use-cases/get-scans.use-case.js'
import type { ClockAnchor } from '../../../shared/services/server-clock.service.js'
import type { BatchScanResult } from '../../domain/entities/scan.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ScanResult } from '../../domain/entities/scan.entity.js'

export class ScanResultResponsePersonDto {
  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  @ApiProperty({ type: String })
  subjectType!: string

  @ApiProperty({ type: String, nullable: true })
  photoUrl!: string | null

  static fromDomain(
    domain: NonNullable<ScanResult['person']>,
  ): ScanResultResponsePersonDto {
    const dto = new ScanResultResponsePersonDto()
    dto.displayName = domain.displayName
    dto.subjectType = domain.subjectType
    dto.photoUrl = domain.photoUrl
    return dto
  }
}

export class ScanResultResponseDto {
  @ApiProperty({
    enum: [
      'ACCEPTED',
      'DUPLICATE',
      'REJECTED_UNKNOWN',
      'REJECTED_REVOKED',
      'REJECTED_INACTIVE',
      'REJECTED_STALE',
    ],
  })
  outcome!:
    | 'ACCEPTED'
    | 'DUPLICATE'
    | 'REJECTED_UNKNOWN'
    | 'REJECTED_REVOKED'
    | 'REJECTED_INACTIVE'
    | 'REJECTED_STALE'

  @ApiPropertyOptional({ type: () => ScanResultResponsePersonDto })
  person?: ScanResultResponsePersonDto

  @ApiPropertyOptional({ type: String })
  rejectionReason?: string

  @ApiPropertyOptional({ type: Boolean })
  leaveConflict?: boolean

  @ApiProperty({ enum: ['CHECK_IN', 'CHECK_OUT', 'NONE'] })
  direction!: 'CHECK_IN' | 'CHECK_OUT' | 'NONE'

  @ApiProperty({
    enum: [
      'PRESENT',
      'LATE',
      'ABSENT',
      'ON_LEAVE',
      'OFFICIAL_DUTY',
      'NOT_EXPECTED',
    ],
  })
  dayStatus!:
    | 'PRESENT'
    | 'LATE'
    | 'ABSENT'
    | 'ON_LEAVE'
    | 'OFFICIAL_DUTY'
    | 'NOT_EXPECTED'

  @ApiProperty({ type: Number })
  lateMinutes!: number

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: string

  static fromDomain(domain: ScanResult): ScanResultResponseDto {
    const dto = new ScanResultResponseDto()
    dto.outcome = domain.outcome
    if (domain.person !== undefined)
      dto.person =
        domain.person == null
          ? domain.person
          : ScanResultResponsePersonDto.fromDomain(domain.person)
    dto.rejectionReason = domain.rejectionReason
    dto.leaveConflict = domain.leaveConflict
    dto.direction = domain.direction
    dto.dayStatus = domain.dayStatus
    dto.lateMinutes = domain.lateMinutes
    dto.recordedAt = domain.recordedAt.toISOString()
    return dto
  }
}

export class BatchScanResultResponseDto {
  @ApiProperty({ type: String })
  clientEventId!: string

  @ApiProperty({
    enum: [
      'ACCEPTED',
      'DUPLICATE',
      'REJECTED_UNKNOWN',
      'REJECTED_REVOKED',
      'REJECTED_INACTIVE',
      'REJECTED_STALE',
    ],
  })
  outcome!:
    | 'ACCEPTED'
    | 'DUPLICATE'
    | 'REJECTED_UNKNOWN'
    | 'REJECTED_REVOKED'
    | 'REJECTED_INACTIVE'
    | 'REJECTED_STALE'

  @ApiProperty({ type: Boolean })
  accepted!: boolean

  static fromDomain(domain: BatchScanResult): BatchScanResultResponseDto {
    const dto = new BatchScanResultResponseDto()
    dto.clientEventId = domain.clientEventId
    dto.outcome = domain.outcome
    dto.accepted = domain.accepted
    return dto
  }
}

export class ClockAnchorResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  serverTime!: string

  @ApiProperty({ type: String })
  anchorId!: string

  @ApiProperty({ type: Number })
  maxOfflineWindowHours!: number

  static fromDomain(domain: ClockAnchor): ClockAnchorResponseDto {
    const dto = new ClockAnchorResponseDto()
    dto.serverTime = domain.serverTime.toISOString()
    dto.anchorId = domain.anchorId
    dto.maxOfflineWindowHours = domain.maxOfflineWindowHours
    return dto
  }
}

export class ScanListItemResponseDeviceDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ScanWithDevice['device']>,
  ): ScanListItemResponseDeviceDto {
    const dto = new ScanListItemResponseDeviceDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ScanListItemResponseDto {
  @ApiProperty({ type: () => ScanListItemResponseDeviceDto })
  device!: ScanListItemResponseDeviceDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  deviceId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  credentialId?: string | null

  @ApiProperty({ type: String })
  presentedCode!: string

  @ApiProperty({ type: String })
  clientEventId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  occurredAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  receivedAt!: string

  @ApiProperty({
    enum: [
      'ACCEPTED',
      'DUPLICATE',
      'REJECTED_UNKNOWN',
      'REJECTED_REVOKED',
      'REJECTED_INACTIVE',
      'REJECTED_STALE',
    ],
  })
  outcome!:
    | 'ACCEPTED'
    | 'DUPLICATE'
    | 'REJECTED_UNKNOWN'
    | 'REJECTED_REVOKED'
    | 'REJECTED_INACTIVE'
    | 'REJECTED_STALE'

  @ApiPropertyOptional({ type: String, nullable: true })
  rejectionReason?: string | null

  static fromDomain(domain: ScanWithDevice): ScanListItemResponseDto {
    const dto = new ScanListItemResponseDto()
    dto.device = ScanListItemResponseDeviceDto.fromDomain(domain.device)
    dto.id = domain.id
    dto.deviceId = domain.deviceId
    dto.credentialId = domain.credentialId
    dto.presentedCode = domain.presentedCode
    dto.clientEventId = domain.clientEventId
    dto.occurredAt = domain.occurredAt.toISOString()
    dto.receivedAt = domain.receivedAt.toISOString()
    dto.outcome = domain.outcome
    dto.rejectionReason = domain.rejectionReason
    return dto
  }
}

export class ScanListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetScansUseCase['execute']>>['meta'],
  ): ScanListResponseMetaDto {
    const dto = new ScanListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class ScanListResponseDto {
  @ApiProperty({ type: () => [ScanListItemResponseDto] })
  data!: ScanListItemResponseDto[]

  @ApiProperty({ type: () => ScanListResponseMetaDto })
  meta!: ScanListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetScansUseCase['execute']>>,
  ): ScanListResponseDto {
    const dto = new ScanListResponseDto()
    dto.data = domain.data.map((item) =>
      ScanListItemResponseDto.fromDomain(item),
    )
    dto.meta = ScanListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
