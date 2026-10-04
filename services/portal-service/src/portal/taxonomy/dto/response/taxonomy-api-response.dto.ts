import type { PostTagEntity } from '../../domain/interfaces/tag-repository.interface.js'
import type { PostCategoryWithCount } from '../../domain/interfaces/category-repository.interface.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { PostCategoryEntity } from '../../domain/interfaces/category-repository.interface.js'

export class PostCategoryResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  displayOrder!: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: PostCategoryEntity): PostCategoryResponseDto {
    const dto = new PostCategoryResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.slug = domain.slug
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.displayOrder = domain.displayOrder
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

export class PublicPostCategoryResponseDto {
  @ApiProperty({ type: Number })
  publishedCount!: number

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  displayOrder!: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: PostCategoryWithCount,
  ): PublicPostCategoryResponseDto {
    const dto = new PublicPostCategoryResponseDto()
    dto.publishedCount = domain.publishedCount
    dto.id = domain.id
    dto.name = domain.name
    dto.slug = domain.slug
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.displayOrder = domain.displayOrder
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

export class PostTagResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  static fromDomain(domain: PostTagEntity): PostTagResponseDto {
    const dto = new PostTagResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.slug = domain.slug
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    return dto
  }
}
