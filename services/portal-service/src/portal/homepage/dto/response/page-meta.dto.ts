import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PageMetaDto {
  @ApiProperty() title: string
  @ApiProperty() description: string

  @ApiProperty({ description: 'Absolute address this content lives at' })
  canonicalUrl: string

  @ApiPropertyOptional({
    description:
      'Always a /portal/public/media/:id?variant=preview address, never a signed URL — a crawler caches what it is given, and an expiring URL becomes a dead image in every card already shared',
  })
  imageUrl: string | null

  @ApiProperty({ enum: ['website', 'article'] })
  type: 'website' | 'article'

  @ApiPropertyOptional() publishedAt: Date | null
}

export class SitemapEntryDto {
  @ApiProperty({ example: '/berita/juara-1-olimpiade' }) path: string
  @ApiProperty() lastModified: Date
}
