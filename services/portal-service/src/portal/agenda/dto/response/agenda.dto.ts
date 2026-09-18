import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AgendaSummaryDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() title: string
  @ApiProperty() slug: string
  @ApiProperty({ description: 'Sanitized HTML' }) description: string
  @ApiProperty() startTime: Date
  @ApiProperty() endTime: Date
  @ApiProperty() location: string

  @ApiPropertyOptional({
    description: 'Stable public media address, never a signed URL',
  })
  coverImageUrl: string | null

  @ApiProperty() publishedAt: Date
}
