import type { GetPermissionsUseCase } from '../../../../application/use-cases/get-permissions/get-permissions.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { PermissionEntity } from '../../../../../domain/entities/permission.entity.js'

export class PermissionItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  module!: string

  @ApiProperty({ type: String })
  action!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: PermissionEntity): PermissionItemResponseDto {
    const dto = new PermissionItemResponseDto()
    dto.id = domain.id
    dto.module = domain.module
    dto.action = domain.action
    dto.code = domain.code
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class PermissionSyncResponseDto {
  @ApiProperty({ type: String })
  message!: string
}

export class PermissionCatalogItemResponseDto {
  @ApiProperty({
    enum: [
      'academic',
      'platform',
      'portal',
      'admission',
      'inventory',
      'presence',
      'hr',
      'payroll',
    ],
  })
  app!:
    | 'academic'
    | 'platform'
    | 'portal'
    | 'admission'
    | 'inventory'
    | 'presence'
    | 'hr'
    | 'payroll'

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  module!: string

  @ApiProperty({ type: String })
  action!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetPermissionsUseCase['execute']>>[number],
  ): PermissionCatalogItemResponseDto {
    const dto = new PermissionCatalogItemResponseDto()
    dto.app = domain.app
    dto.id = domain.id
    dto.module = domain.module
    dto.action = domain.action
    dto.code = domain.code
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}
