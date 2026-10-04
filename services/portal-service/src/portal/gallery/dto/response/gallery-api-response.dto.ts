import type { GetPublicAlbumsUseCase } from '../../use-cases/get-public-album.use-case.js'
import type { GetPublicAlbumBySlugUseCase } from '../../use-cases/get-public-album.use-case.js'
import type { GalleryAlbumWithCount } from '../../domain/interfaces/gallery-repository.interface.js'
import type { GetAlbumsUseCase } from '../../use-cases/manage-album.use-cases.js'
import type { AddPhotoUseCase } from '../../use-cases/manage-photo.use-cases.js'
import type { CreateAlbumUseCase } from '../../use-cases/manage-album.use-cases.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetAlbumByIdUseCase } from '../../use-cases/manage-album.use-cases.js'

export class GalleryAlbumDetailResponsePhotosDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  albumId!: string

  @ApiProperty({ type: String })
  fileId!: string

  @ApiProperty({ type: String, nullable: true })
  caption!: string | null

  @ApiProperty({ type: String })
  altText!: string

  @ApiProperty({ type: Number })
  displayOrder!: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetAlbumByIdUseCase['execute']>>['photos']
      >[number]
    >,
  ): GalleryAlbumDetailResponsePhotosDto {
    const dto = new GalleryAlbumDetailResponsePhotosDto()
    dto.id = domain.id
    dto.albumId = domain.albumId
    dto.fileId = domain.fileId
    dto.caption = domain.caption
    dto.altText = domain.altText
    dto.displayOrder = domain.displayOrder
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    return dto
  }
}

export class GalleryAlbumDetailResponseDto {
  @ApiProperty({
    type: () => GalleryAlbumDetailResponsePhotosDto,
    isArray: true,
  })
  photos!: GalleryAlbumDetailResponsePhotosDto[]

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  eventDate!: string

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
    domain: Awaited<ReturnType<GetAlbumByIdUseCase['execute']>>,
  ): GalleryAlbumDetailResponseDto {
    const dto = new GalleryAlbumDetailResponseDto()
    dto.photos = domain.photos.map((x) =>
      GalleryAlbumDetailResponsePhotosDto.fromDomain(x),
    )
    dto.coverImageUrl = domain.coverImageUrl
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.eventDate = domain.eventDate.toISOString()
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

export class GalleryAlbumResponseDto {
  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  eventDate!: string

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
    domain: Awaited<ReturnType<CreateAlbumUseCase['execute']>>,
  ): GalleryAlbumResponseDto {
    const dto = new GalleryAlbumResponseDto()
    dto.coverImageUrl = domain.coverImageUrl
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.eventDate = domain.eventDate.toISOString()
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

export class GalleryPhotoResponseDto {
  @ApiProperty({ type: String })
  imageUrl!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  albumId!: string

  @ApiProperty({ type: String })
  fileId!: string

  @ApiProperty({ type: String, nullable: true })
  caption!: string | null

  @ApiProperty({ type: String })
  altText!: string

  @ApiProperty({ type: Number })
  displayOrder!: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<AddPhotoUseCase['execute']>>,
  ): GalleryPhotoResponseDto {
    const dto = new GalleryPhotoResponseDto()
    dto.imageUrl = domain.imageUrl
    dto.id = domain.id
    dto.albumId = domain.albumId
    dto.fileId = domain.fileId
    dto.caption = domain.caption
    dto.altText = domain.altText
    dto.displayOrder = domain.displayOrder
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    return dto
  }
}

export class GalleryAlbumListItemResponseDto {
  @ApiProperty({ type: Number })
  photoCount!: number

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  eventDate!: string

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
    domain: GalleryAlbumWithCount,
  ): GalleryAlbumListItemResponseDto {
    const dto = new GalleryAlbumListItemResponseDto()
    dto.photoCount = domain.photoCount
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.eventDate = domain.eventDate.toISOString()
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

export class GalleryAlbumListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetAlbumsUseCase['execute']>>['meta'],
  ): GalleryAlbumListResponseMetaDto {
    const dto = new GalleryAlbumListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class GalleryAlbumListResponseDto {
  @ApiProperty({ type: () => [GalleryAlbumListItemResponseDto] })
  data!: GalleryAlbumListItemResponseDto[]

  @ApiProperty({ type: () => GalleryAlbumListResponseMetaDto })
  meta!: GalleryAlbumListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetAlbumsUseCase['execute']>>,
  ): GalleryAlbumListResponseDto {
    const dto = new GalleryAlbumListResponseDto()
    dto.data = domain.data.map((item) =>
      GalleryAlbumListItemResponseDto.fromDomain(item),
    )
    dto.meta = GalleryAlbumListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class PublicGalleryAlbumResponsePhotosDataDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  imageUrl!: string

  @ApiProperty({ type: String, nullable: true })
  caption!: string | null

  @ApiProperty({ type: String })
  altText!: string

  @ApiProperty({ type: Number })
  displayOrder!: number

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<ReturnType<GetPublicAlbumBySlugUseCase['execute']>>['photos']
        >['data']
      >[number]
    >,
  ): PublicGalleryAlbumResponsePhotosDataDto {
    const dto = new PublicGalleryAlbumResponsePhotosDataDto()
    dto.id = domain.id
    dto.imageUrl = domain.imageUrl
    dto.caption = domain.caption
    dto.altText = domain.altText
    dto.displayOrder = domain.displayOrder
    return dto
  }
}

export class PublicGalleryAlbumResponsePhotosMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetPublicAlbumBySlugUseCase['execute']>>['photos']
      >['meta']
    >,
  ): PublicGalleryAlbumResponsePhotosMetaDto {
    const dto = new PublicGalleryAlbumResponsePhotosMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class PublicGalleryAlbumResponsePhotosDto {
  @ApiProperty({
    type: () => PublicGalleryAlbumResponsePhotosDataDto,
    isArray: true,
  })
  data!: PublicGalleryAlbumResponsePhotosDataDto[]

  @ApiProperty({ type: () => PublicGalleryAlbumResponsePhotosMetaDto })
  meta!: PublicGalleryAlbumResponsePhotosMetaDto

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetPublicAlbumBySlugUseCase['execute']>>['photos']
    >,
  ): PublicGalleryAlbumResponsePhotosDto {
    const dto = new PublicGalleryAlbumResponsePhotosDto()
    dto.data = domain.data.map((x) =>
      PublicGalleryAlbumResponsePhotosDataDto.fromDomain(x),
    )
    dto.meta = PublicGalleryAlbumResponsePhotosMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class PublicGalleryAlbumResponseDto {
  @ApiProperty({ type: () => PublicGalleryAlbumResponsePhotosDto })
  photos!: PublicGalleryAlbumResponsePhotosDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  eventDate!: string

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: Number })
  photoCount!: number

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetPublicAlbumBySlugUseCase['execute']>>,
  ): PublicGalleryAlbumResponseDto {
    const dto = new PublicGalleryAlbumResponseDto()
    dto.photos = PublicGalleryAlbumResponsePhotosDto.fromDomain(domain.photos)
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.eventDate = domain.eventDate.toISOString()
    dto.coverImageUrl = domain.coverImageUrl
    dto.photoCount = domain.photoCount
    dto.publishedAt = domain.publishedAt.toISOString()
    return dto
  }
}

export class PublicGalleryAlbumListItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  eventDate!: string

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl!: string | null

  @ApiProperty({ type: Number })
  photoCount!: number

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: string

  static fromDomain(
    domain: Awaited<
      ReturnType<GetPublicAlbumsUseCase['execute']>
    >['data'][number],
  ): PublicGalleryAlbumListItemResponseDto {
    const dto = new PublicGalleryAlbumListItemResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.description = domain.description
    dto.eventDate = domain.eventDate.toISOString()
    dto.coverImageUrl = domain.coverImageUrl
    dto.photoCount = domain.photoCount
    dto.publishedAt = domain.publishedAt.toISOString()
    return dto
  }
}

export class PublicGalleryAlbumListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetPublicAlbumsUseCase['execute']>>['meta'],
  ): PublicGalleryAlbumListResponseMetaDto {
    const dto = new PublicGalleryAlbumListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class PublicGalleryAlbumListResponseDto {
  @ApiProperty({ type: () => [PublicGalleryAlbumListItemResponseDto] })
  data!: PublicGalleryAlbumListItemResponseDto[]

  @ApiProperty({ type: () => PublicGalleryAlbumListResponseMetaDto })
  meta!: PublicGalleryAlbumListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetPublicAlbumsUseCase['execute']>>,
  ): PublicGalleryAlbumListResponseDto {
    const dto = new PublicGalleryAlbumListResponseDto()
    dto.data = domain.data.map((item) =>
      PublicGalleryAlbumListItemResponseDto.fromDomain(item),
    )
    dto.meta = PublicGalleryAlbumListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
