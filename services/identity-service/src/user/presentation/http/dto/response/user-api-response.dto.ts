import type { ProvisionAccountUseCase } from '../../../../application/use-cases/provision-account/provision-account.use-case.js'
import type { UserSummary } from '../../../../domain/repositories/user.repository.js'
import type { GetUsersUseCase } from '../../../../application/use-cases/get-users/get-users.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { UserPublic } from '../../../../domain/entities/user.entity.js'

export class UserPublicResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastLoginAt!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: UserPublic): UserPublicResponseDto {
    const dto = new UserPublicResponseDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    dto.lastLoginAt =
      domain.lastLoginAt == null
        ? domain.lastLoginAt
        : domain.lastLoginAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class UserPublicListItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastLoginAt!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: UserPublic): UserPublicListItemResponseDto {
    const dto = new UserPublicListItemResponseDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    dto.lastLoginAt =
      domain.lastLoginAt == null
        ? domain.lastLoginAt
        : domain.lastLoginAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class UserPublicListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetUsersUseCase['execute']>>['meta'],
  ): UserPublicListResponseMetaDto {
    const dto = new UserPublicListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class UserPublicListResponseDto {
  @ApiProperty({ type: () => [UserPublicListItemResponseDto] })
  data!: UserPublicListItemResponseDto[]

  @ApiProperty({ type: () => UserPublicListResponseMetaDto })
  meta!: UserPublicListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetUsersUseCase['execute']>>,
  ): UserPublicListResponseDto {
    const dto = new UserPublicListResponseDto()
    dto.data = domain.data.map((item) =>
      UserPublicListItemResponseDto.fromDomain(item),
    )
    dto.meta = UserPublicListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class UserStatsResponseDto {
  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  active!: number

  @ApiProperty({ type: Number })
  inactive!: number

  static fromDomain(domain: UserSummary): UserStatsResponseDto {
    const dto = new UserStatsResponseDto()
    dto.total = domain.total
    dto.active = domain.active
    dto.inactive = domain.inactive
    return dto
  }
}

export class AccountProvisionResultResponseDto {
  @ApiProperty({ type: String })
  id!: string

  static fromDomain(
    domain: Awaited<ReturnType<ProvisionAccountUseCase['execute']>>,
  ): AccountProvisionResultResponseDto {
    const dto = new AccountProvisionResultResponseDto()
    dto.id = domain.id
    return dto
  }
}
