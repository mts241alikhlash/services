import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { RoleWithPermissionsEntity } from '../../../../../domain/entities/role.entity.js'

export class RoleWithPermissionsResponsePermissionsDto {
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
    domain: NonNullable<
      NonNullable<RoleWithPermissionsEntity['permissions']>[number]
    >,
  ): RoleWithPermissionsResponsePermissionsDto {
    const dto = new RoleWithPermissionsResponsePermissionsDto()
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

export class RoleWithPermissionsResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: Boolean })
  isSystem!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiProperty({
    type: () => RoleWithPermissionsResponsePermissionsDto,
    isArray: true,
  })
  permissions!: RoleWithPermissionsResponsePermissionsDto[]

  static fromDomain(
    domain: RoleWithPermissionsEntity,
  ): RoleWithPermissionsResponseDto {
    const dto = new RoleWithPermissionsResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.code = domain.code
    dto.description = domain.description
    dto.isSystem = domain.isSystem
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.permissions = domain.permissions.map((x) =>
      RoleWithPermissionsResponsePermissionsDto.fromDomain(x),
    )
    return dto
  }
}
