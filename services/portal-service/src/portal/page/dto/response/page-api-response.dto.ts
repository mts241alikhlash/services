import type { PublicNavItem } from '../../domain/interfaces/navigation-repository.interface.js'
import type { PublicPageResult } from '../../use-cases/get-public-page.use-case.js'
import type { PortalPageEntity } from '../../domain/interfaces/page-repository.interface.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { NavItemEntity } from '../../domain/interfaces/navigation-repository.interface.js'

export class NavItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  label!: string

  @ApiProperty({ type: String, nullable: true })
  pageId!: string | null

  @ApiProperty({ type: String, nullable: true })
  routeKey!: string | null

  @ApiProperty({ type: String, nullable: true })
  externalUrl!: string | null

  @ApiProperty({ type: Number })
  displayOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: NavItemEntity): NavItemResponseDto {
    const dto = new NavItemResponseDto()
    dto.id = domain.id
    dto.label = domain.label
    dto.pageId = domain.pageId
    dto.routeKey = domain.routeKey
    dto.externalUrl = domain.externalUrl
    dto.displayOrder = domain.displayOrder
    dto.isActive = domain.isActive
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

export class PortalPageResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String })
  body!: string

  @ApiProperty({ type: String, nullable: true })
  metaTitle!: string | null

  @ApiProperty({ type: String, nullable: true })
  metaDescription!: string | null

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] })
  status!: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: string | null

  @ApiProperty({ type: String })
  authorId!: string

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: PortalPageEntity): PortalPageResponseDto {
    const dto = new PortalPageResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.slug = domain.slug
    dto.body = domain.body
    dto.metaTitle = domain.metaTitle
    dto.metaDescription = domain.metaDescription
    dto.status = domain.status
    dto.publishedAt =
      domain.publishedAt == null
        ? domain.publishedAt
        : domain.publishedAt.toISOString()
    dto.authorId = domain.authorId
    dto.version = domain.version
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class PublicNavItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  label!: string

  @ApiProperty({ type: String })
  href!: string

  @ApiProperty({ type: Boolean })
  isExternal!: boolean

  static fromDomain(domain: PublicNavItem): PublicNavItemResponseDto {
    const dto = new PublicNavItemResponseDto()
    dto.id = domain.id
    dto.label = domain.label
    dto.href = domain.href
    dto.isExternal = domain.isExternal
    return dto
  }
}

type PublicPage = Extract<PublicPageResult, { kind: 'found' }>['page']

export class PublicPageResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  slug!: string

  @ApiProperty({ type: String })
  body!: string

  @ApiProperty({ type: String })
  metaTitle!: string

  @ApiProperty({ type: String })
  metaDescription!: string

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(page: PublicPage): PublicPageResponseDto {
    const dto = new PublicPageResponseDto()
    dto.id = page.id
    dto.title = page.title
    dto.slug = page.slug
    dto.body = page.body
    dto.metaTitle = page.metaTitle
    dto.metaDescription = page.metaDescription
    dto.publishedAt = page.publishedAt.toISOString()
    dto.updatedAt = page.updatedAt.toISOString()
    return dto
  }
}
