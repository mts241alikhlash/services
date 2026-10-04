import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AdmissionAnnouncementWithWave } from '../../../../domain/repositories/admission-announcement-repository.js'
import type { GetAdmissionAnnouncementsUseCase } from '../../../../application/use-cases/get-admission-announcements/get-admission-announcements.use-case.js'

export class AdmissionAnnouncementWaveResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  code!: string

  static fromDomain(
    domain: NonNullable<AdmissionAnnouncementWithWave['wave']>,
  ): AdmissionAnnouncementWaveResponseDto {
    const dto = new AdmissionAnnouncementWaveResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.code = domain.code
    return dto
  }
}

export class AdmissionAnnouncementResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  content!: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishDate?: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt?: string | null

  @ApiProperty({ type: String, nullable: true })
  waveId!: string | null

  @ApiPropertyOptional({
    type: () => AdmissionAnnouncementWaveResponseDto,
    nullable: true,
  })
  wave?: AdmissionAnnouncementWaveResponseDto | null

  @ApiPropertyOptional({ type: Boolean })
  isPublished?: boolean

  @ApiPropertyOptional({ type: String, nullable: true })
  createdById?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: AdmissionAnnouncementWithWave,
  ): AdmissionAnnouncementResponseDto {
    const dto = new AdmissionAnnouncementResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.content = domain.content
    if (domain.publishDate !== undefined)
      dto.publishDate =
        domain.publishDate == null
          ? domain.publishDate
          : domain.publishDate.toISOString()
    if (domain.publishedAt !== undefined)
      dto.publishedAt =
        domain.publishedAt == null
          ? domain.publishedAt
          : domain.publishedAt.toISOString()
    dto.waveId = domain.waveId
    if (domain.wave !== undefined)
      dto.wave =
        domain.wave == null
          ? domain.wave
          : AdmissionAnnouncementWaveResponseDto.fromDomain(domain.wave)
    dto.isPublished = domain.isPublished
    dto.createdById = domain.createdById
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionAnnouncementListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<
      ReturnType<GetAdmissionAnnouncementsUseCase['execute']>
    >['meta'],
  ): AdmissionAnnouncementListResponseMetaDto {
    const dto = new AdmissionAnnouncementListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class AdmissionAnnouncementListResponseDto {
  @ApiProperty({ type: () => [AdmissionAnnouncementResponseDto] })
  data!: AdmissionAnnouncementResponseDto[]

  @ApiProperty({ type: () => AdmissionAnnouncementListResponseMetaDto })
  meta!: AdmissionAnnouncementListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetAdmissionAnnouncementsUseCase['execute']>>,
  ): AdmissionAnnouncementListResponseDto {
    const dto = new AdmissionAnnouncementListResponseDto()
    dto.data = domain.data.map((item) =>
      AdmissionAnnouncementResponseDto.fromDomain(item),
    )
    dto.meta = AdmissionAnnouncementListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
