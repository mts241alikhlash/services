import type { CredentialEntity } from '../../domain/entities/credential.entity.js'
import type { CredentialWithCode } from '../../domain/entities/credential.entity.js'
import type { GetCredentialsUseCase } from '../../use-cases/get-credentials.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CredentialWithHolder } from '../../domain/entities/credential.entity.js'

export class CredentialResponseHolderDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  @ApiProperty({ type: String, nullable: true })
  photoUrl!: string | null

  static fromDomain(
    domain: NonNullable<CredentialWithHolder['holder']>,
  ): CredentialResponseHolderDto {
    const dto = new CredentialResponseHolderDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.displayName = domain.displayName
    dto.photoUrl = domain.photoUrl
    return dto
  }
}

export class CredentialResponseDto {
  @ApiProperty({ type: () => CredentialResponseHolderDto })
  holder!: CredentialResponseHolderDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'REPLACED'] })
  status!: 'ACTIVE' | 'REVOKED' | 'REPLACED'

  @ApiProperty({ type: String, format: 'date-time' })
  issuedAt!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  issuedBy?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revokedReason?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  replacedById?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: CredentialWithHolder): CredentialResponseDto {
    const dto = new CredentialResponseDto()
    dto.holder = CredentialResponseHolderDto.fromDomain(domain.holder)
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.status = domain.status
    dto.issuedAt = domain.issuedAt.toISOString()
    dto.issuedBy = domain.issuedBy
    if (domain.revokedAt !== undefined)
      dto.revokedAt =
        domain.revokedAt == null
          ? domain.revokedAt
          : domain.revokedAt.toISOString()
    dto.revokedReason = domain.revokedReason
    dto.replacedById = domain.replacedById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class CredentialListItemResponseHolderDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  @ApiProperty({ type: String, nullable: true })
  photoUrl!: string | null

  static fromDomain(
    domain: NonNullable<CredentialWithHolder['holder']>,
  ): CredentialListItemResponseHolderDto {
    const dto = new CredentialListItemResponseHolderDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.displayName = domain.displayName
    dto.photoUrl = domain.photoUrl
    return dto
  }
}

export class CredentialListItemResponseDto {
  @ApiProperty({ type: () => CredentialListItemResponseHolderDto })
  holder!: CredentialListItemResponseHolderDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'REPLACED'] })
  status!: 'ACTIVE' | 'REVOKED' | 'REPLACED'

  @ApiProperty({ type: String, format: 'date-time' })
  issuedAt!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  issuedBy?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revokedReason?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  replacedById?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: CredentialWithHolder,
  ): CredentialListItemResponseDto {
    const dto = new CredentialListItemResponseDto()
    dto.holder = CredentialListItemResponseHolderDto.fromDomain(domain.holder)
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.status = domain.status
    dto.issuedAt = domain.issuedAt.toISOString()
    dto.issuedBy = domain.issuedBy
    if (domain.revokedAt !== undefined)
      dto.revokedAt =
        domain.revokedAt == null
          ? domain.revokedAt
          : domain.revokedAt.toISOString()
    dto.revokedReason = domain.revokedReason
    dto.replacedById = domain.replacedById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class CredentialListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetCredentialsUseCase['execute']>>['meta'],
  ): CredentialListResponseMetaDto {
    const dto = new CredentialListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class CredentialListResponseDto {
  @ApiProperty({ type: () => [CredentialListItemResponseDto] })
  data!: CredentialListItemResponseDto[]

  @ApiProperty({ type: () => CredentialListResponseMetaDto })
  meta!: CredentialListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetCredentialsUseCase['execute']>>,
  ): CredentialListResponseDto {
    const dto = new CredentialListResponseDto()
    dto.data = domain.data.map((item) =>
      CredentialListItemResponseDto.fromDomain(item),
    )
    dto.meta = CredentialListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class CredentialWithCodeResponseHolderDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  @ApiProperty({ type: String, nullable: true })
  photoUrl!: string | null

  static fromDomain(
    domain: NonNullable<CredentialWithCode['holder']>,
  ): CredentialWithCodeResponseHolderDto {
    const dto = new CredentialWithCodeResponseHolderDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.displayName = domain.displayName
    dto.photoUrl = domain.photoUrl
    return dto
  }
}

export class CredentialWithCodeResponseDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: () => CredentialWithCodeResponseHolderDto })
  holder!: CredentialWithCodeResponseHolderDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'REPLACED'] })
  status!: 'ACTIVE' | 'REVOKED' | 'REPLACED'

  @ApiProperty({ type: String, format: 'date-time' })
  issuedAt!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  issuedBy?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revokedReason?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  replacedById?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: CredentialWithCode): CredentialWithCodeResponseDto {
    const dto = new CredentialWithCodeResponseDto()
    dto.code = domain.code
    dto.holder = CredentialWithCodeResponseHolderDto.fromDomain(domain.holder)
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.status = domain.status
    dto.issuedAt = domain.issuedAt.toISOString()
    dto.issuedBy = domain.issuedBy
    if (domain.revokedAt !== undefined)
      dto.revokedAt =
        domain.revokedAt == null
          ? domain.revokedAt
          : domain.revokedAt.toISOString()
    dto.revokedReason = domain.revokedReason
    dto.replacedById = domain.replacedById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class CredentialStatusResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ enum: ['ACTIVE', 'REVOKED', 'REPLACED'] })
  status!: 'ACTIVE' | 'REVOKED' | 'REPLACED'

  @ApiProperty({ type: String, format: 'date-time' })
  issuedAt!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  issuedBy?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  revokedReason?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  replacedById?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: CredentialEntity): CredentialStatusResponseDto {
    const dto = new CredentialStatusResponseDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.status = domain.status
    dto.issuedAt = domain.issuedAt.toISOString()
    dto.issuedBy = domain.issuedBy
    if (domain.revokedAt !== undefined)
      dto.revokedAt =
        domain.revokedAt == null
          ? domain.revokedAt
          : domain.revokedAt.toISOString()
    dto.revokedReason = domain.revokedReason
    dto.replacedById = domain.replacedById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}
