import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { UploadFileUseCase } from '../../use-cases/upload-file.use-case.js'

export class PortalFileResponseDto {
  @ApiProperty({ type: String })
  url!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  categoryId!: string | null

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  @ApiProperty({ type: String, nullable: true })
  uploadedBy!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: Awaited<ReturnType<UploadFileUseCase['execute']>>,
  ): PortalFileResponseDto {
    const dto = new PortalFileResponseDto()
    dto.url = domain.url
    dto.id = domain.id
    dto.categoryId = domain.categoryId
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    dto.uploadedBy = domain.uploadedBy
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}
