import type { GetMediaUsageUseCase } from '../../use-cases/get-media-usage.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetMediaLibraryUseCase } from '../../use-cases/get-media-library.use-case.js'

export class MediaLibraryItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String })
  previewUrl!: string

  @ApiProperty({ type: String })
  publicUrl!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetMediaLibraryUseCase['execute']>>[number],
  ): MediaLibraryItemResponseDto {
    const dto = new MediaLibraryItemResponseDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.createdAt = domain.createdAt.toISOString()
    dto.previewUrl = domain.previewUrl
    dto.publicUrl = domain.publicUrl
    return dto
  }
}

export class MediaUsageResponseUsedByDto {
  @ApiProperty({ enum: ['COVER', 'BODY', 'ATTACHMENT', 'ALBUM_PHOTO'] })
  kind!: 'COVER' | 'BODY' | 'ATTACHMENT' | 'ALBUM_PHOTO'

  @ApiProperty({ enum: ['post', 'agenda', 'album', 'page'] })
  ownerType!: 'post' | 'agenda' | 'album' | 'page'

  @ApiProperty({ type: String })
  ownerId!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: Boolean })
  isPublic!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMediaUsageUseCase['execute']>>['usedBy']
      >[number]
    >,
  ): MediaUsageResponseUsedByDto {
    const dto = new MediaUsageResponseUsedByDto()
    dto.kind = domain.kind
    dto.ownerType = domain.ownerType
    dto.ownerId = domain.ownerId
    dto.title = domain.title
    dto.isPublic = domain.isPublic
    return dto
  }
}

export class MediaUsageResponseDto {
  @ApiProperty({ type: String })
  fileId!: string

  @ApiProperty({ type: Boolean })
  isPubliclyReachable!: boolean

  @ApiProperty({ type: () => MediaUsageResponseUsedByDto, isArray: true })
  usedBy!: MediaUsageResponseUsedByDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetMediaUsageUseCase['execute']>>,
  ): MediaUsageResponseDto {
    const dto = new MediaUsageResponseDto()
    dto.fileId = domain.fileId
    dto.isPubliclyReachable = domain.isPubliclyReachable
    dto.usedBy = domain.usedBy.map((x) =>
      MediaUsageResponseUsedByDto.fromDomain(x),
    )
    return dto
  }
}
