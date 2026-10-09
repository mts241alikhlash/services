import { ApiProperty } from '@nestjs/swagger'
import type { AdmissionDownloadEntity } from '../../../../domain/entities/admission-download.entity.js'

export class AdmissionDownloadResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String })
  fileName!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: AdmissionDownloadEntity,
  ): AdmissionDownloadResponseDto {
    const dto = new AdmissionDownloadResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.description = domain.description
    dto.fileName = domain.fileName
    dto.sizeBytes = domain.sizeBytes
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionDownloadListResponseDto {
  @ApiProperty({ type: () => [AdmissionDownloadResponseDto] })
  data!: AdmissionDownloadResponseDto[]

  static fromDomain(
    rows: AdmissionDownloadEntity[],
  ): AdmissionDownloadListResponseDto {
    const dto = new AdmissionDownloadListResponseDto()
    dto.data = rows.map((row) => AdmissionDownloadResponseDto.fromDomain(row))
    return dto
  }
}

export class AdmissionActiveDownloadResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String })
  fileName!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  static fromDomain(
    domain: AdmissionDownloadEntity,
  ): AdmissionActiveDownloadResponseDto {
    const dto = new AdmissionActiveDownloadResponseDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.description = domain.description
    dto.fileName = domain.fileName
    dto.sizeBytes = domain.sizeBytes
    return dto
  }
}

export class AdmissionActiveDownloadListResponseDto {
  @ApiProperty({ type: () => [AdmissionActiveDownloadResponseDto] })
  data!: AdmissionActiveDownloadResponseDto[]

  static fromDomain(
    rows: AdmissionDownloadEntity[],
  ): AdmissionActiveDownloadListResponseDto {
    const dto = new AdmissionActiveDownloadListResponseDto()
    dto.data = rows.map((row) =>
      AdmissionActiveDownloadResponseDto.fromDomain(row),
    )
    return dto
  }
}
