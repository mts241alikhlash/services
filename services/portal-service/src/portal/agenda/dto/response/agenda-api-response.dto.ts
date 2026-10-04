import type { GetPublicAgendaUseCase } from '../../use-cases/get-public-agenda.use-case.js'
import type { GetPublicAgendaBySlugUseCase } from '../../use-cases/get-public-agenda.use-case.js'
import type { GetAgendaEntriesUseCase } from '../../use-cases/manage-agenda.use-cases.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetAgendaByIdUseCase } from '../../use-cases/manage-agenda.use-cases.js'

export class AgendaAdminResponseDto {
  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: String })
  location!: string

  @ApiProperty({ type: String, nullable: true })
  coverFileId!: string | null

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] })
  status!: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  scheduledAt!: string | null

  @ApiProperty({ type: String })
  authorId!: string

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetAgendaByIdUseCase['execute']>>,
  ): AgendaAdminResponseDto {
    const dto = new AgendaAdminResponseDto()
    dto.coverImageUrl = domain.coverImageUrl
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.location = domain.location
    dto.coverFileId = domain.coverFileId
    dto.status = domain.status
    dto.publishedAt =
      domain.publishedAt == null
        ? domain.publishedAt
        : domain.publishedAt.toISOString()
    dto.scheduledAt =
      domain.scheduledAt == null
        ? domain.scheduledAt
        : domain.scheduledAt.toISOString()
    dto.authorId = domain.authorId
    dto.version = domain.version
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AgendaAdminListItemResponseDto {
  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: String })
  location!: string

  @ApiProperty({ type: String, nullable: true })
  coverFileId!: string | null

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] })
  status!: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  scheduledAt!: string | null

  @ApiProperty({ type: String })
  authorId!: string

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: Awaited<
      ReturnType<GetAgendaEntriesUseCase['execute']>
    >['data'][number],
  ): AgendaAdminListItemResponseDto {
    const dto = new AgendaAdminListItemResponseDto()
    dto.coverImageUrl = domain.coverImageUrl
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.location = domain.location
    dto.coverFileId = domain.coverFileId
    dto.status = domain.status
    dto.publishedAt =
      domain.publishedAt == null
        ? domain.publishedAt
        : domain.publishedAt.toISOString()
    dto.scheduledAt =
      domain.scheduledAt == null
        ? domain.scheduledAt
        : domain.scheduledAt.toISOString()
    dto.authorId = domain.authorId
    dto.version = domain.version
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AgendaAdminListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetAgendaEntriesUseCase['execute']>>['meta'],
  ): AgendaAdminListResponseMetaDto {
    const dto = new AgendaAdminListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class AgendaAdminListResponseDto {
  @ApiProperty({ type: () => [AgendaAdminListItemResponseDto] })
  data!: AgendaAdminListItemResponseDto[]

  @ApiProperty({ type: () => AgendaAdminListResponseMetaDto })
  meta!: AgendaAdminListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetAgendaEntriesUseCase['execute']>>,
  ): AgendaAdminListResponseDto {
    const dto = new AgendaAdminListResponseDto()
    dto.data = domain.data.map((item) =>
      AgendaAdminListItemResponseDto.fromDomain(item),
    )
    dto.meta = AgendaAdminListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class PublicAgendaResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: String })
  location!: string

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetPublicAgendaBySlugUseCase['execute']>>,
  ): PublicAgendaResponseDto {
    const dto = new PublicAgendaResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.location = domain.location
    dto.coverImageUrl = domain.coverImageUrl
    dto.publishedAt = domain.publishedAt.toISOString()
    return dto
  }
}

export class PublicAgendaListItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: String })
  location!: string

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: string

  static fromDomain(
    domain: Awaited<
      ReturnType<GetPublicAgendaUseCase['execute']>
    >['data'][number],
  ): PublicAgendaListItemResponseDto {
    const dto = new PublicAgendaListItemResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.location = domain.location
    dto.coverImageUrl = domain.coverImageUrl
    dto.publishedAt = domain.publishedAt.toISOString()
    return dto
  }
}

export class PublicAgendaListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetPublicAgendaUseCase['execute']>>['meta'],
  ): PublicAgendaListResponseMetaDto {
    const dto = new PublicAgendaListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class PublicAgendaListResponseDto {
  @ApiProperty({ type: () => [PublicAgendaListItemResponseDto] })
  data!: PublicAgendaListItemResponseDto[]

  @ApiProperty({ type: () => PublicAgendaListResponseMetaDto })
  meta!: PublicAgendaListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetPublicAgendaUseCase['execute']>>,
  ): PublicAgendaListResponseDto {
    const dto = new PublicAgendaListResponseDto()
    dto.data = domain.data.map((item) =>
      PublicAgendaListItemResponseDto.fromDomain(item),
    )
    dto.meta = PublicAgendaListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
