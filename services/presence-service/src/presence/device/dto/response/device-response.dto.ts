import type { DeviceWithToken } from '../../use-cases/register-device.use-case.js'
import type { GetDevicesUseCase } from '../../use-cases/get-devices.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { DeviceEntity } from '../../domain/entities/device.entity.js'

export class DeviceResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  location?: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSeenAt?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  tokenIssuedAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: DeviceEntity): DeviceResponseDto {
    const dto = new DeviceResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.location = domain.location
    dto.isActive = domain.isActive
    if (domain.lastSeenAt !== undefined)
      dto.lastSeenAt =
        domain.lastSeenAt == null
          ? domain.lastSeenAt
          : domain.lastSeenAt.toISOString()
    dto.tokenIssuedAt = domain.tokenIssuedAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class DeviceListItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  location?: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSeenAt?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  tokenIssuedAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: DeviceEntity): DeviceListItemResponseDto {
    const dto = new DeviceListItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.location = domain.location
    dto.isActive = domain.isActive
    if (domain.lastSeenAt !== undefined)
      dto.lastSeenAt =
        domain.lastSeenAt == null
          ? domain.lastSeenAt
          : domain.lastSeenAt.toISOString()
    dto.tokenIssuedAt = domain.tokenIssuedAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class DeviceListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetDevicesUseCase['execute']>>['meta'],
  ): DeviceListResponseMetaDto {
    const dto = new DeviceListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class DeviceListResponseDto {
  @ApiProperty({ type: () => [DeviceListItemResponseDto] })
  data!: DeviceListItemResponseDto[]

  @ApiProperty({ type: () => DeviceListResponseMetaDto })
  meta!: DeviceListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetDevicesUseCase['execute']>>,
  ): DeviceListResponseDto {
    const dto = new DeviceListResponseDto()
    dto.data = domain.data.map((item) =>
      DeviceListItemResponseDto.fromDomain(item),
    )
    dto.meta = DeviceListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class DeviceWithTokenResponseDeviceDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  location?: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastSeenAt?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  tokenIssuedAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<DeviceWithToken['device']>,
  ): DeviceWithTokenResponseDeviceDto {
    const dto = new DeviceWithTokenResponseDeviceDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.location = domain.location
    dto.isActive = domain.isActive
    if (domain.lastSeenAt !== undefined)
      dto.lastSeenAt =
        domain.lastSeenAt == null
          ? domain.lastSeenAt
          : domain.lastSeenAt.toISOString()
    dto.tokenIssuedAt = domain.tokenIssuedAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class DeviceWithTokenResponseDto {
  @ApiProperty({ type: () => DeviceWithTokenResponseDeviceDto })
  device!: DeviceWithTokenResponseDeviceDto

  @ApiProperty({ type: String })
  token!: string

  static fromDomain(domain: DeviceWithToken): DeviceWithTokenResponseDto {
    const dto = new DeviceWithTokenResponseDto()
    dto.device = DeviceWithTokenResponseDeviceDto.fromDomain(domain.device)
    dto.token = domain.token
    return dto
  }
}
