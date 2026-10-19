import { ApiProperty } from '@nestjs/swagger'
import type { AdmissionDocumentTypeEntity } from '../../../../domain/entities/admission-document-type.entity.js'

export class AdmissionDocumentTypeResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isRequired!: boolean

  @ApiProperty({ enum: ['REQUIRED', 'LATER', 'OPTIONAL'] })
  requirement!: 'REQUIRED' | 'LATER' | 'OPTIONAL'

  @ApiProperty({ type: Number, nullable: true })
  lateDueMonths!: number | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Number })
  documentCount!: number

  static fromDomain(
    domain: AdmissionDocumentTypeEntity,
  ): AdmissionDocumentTypeResponseDto {
    const dto = new AdmissionDocumentTypeResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isRequired = domain.isRequired
    dto.requirement = domain.requirement
    dto.lateDueMonths = domain.lateDueMonths
    dto.isActive = domain.isActive
    dto.sortOrder = domain.sortOrder
    dto.documentCount = domain.documentCount
    return dto
  }
}

export class AdmissionDocumentTypeListResponseDto {
  @ApiProperty({ type: () => [AdmissionDocumentTypeResponseDto] })
  data!: AdmissionDocumentTypeResponseDto[]

  static fromDomain(
    rows: AdmissionDocumentTypeEntity[],
  ): AdmissionDocumentTypeListResponseDto {
    const dto = new AdmissionDocumentTypeListResponseDto()
    dto.data = rows.map((row) =>
      AdmissionDocumentTypeResponseDto.fromDomain(row),
    )
    return dto
  }
}
