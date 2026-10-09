import { ApiProperty } from '@nestjs/swagger'
import type {
  LandingImageEntity,
  LandingOverview,
} from '../../../../domain/entities/landing.entity.js'
import {
  LANDING_SECTION_KEYS,
  type LandingSectionKey,
} from '../../../../domain/landing-section-key.js'

const nullableObject = () =>
  ApiProperty({ type: 'object', additionalProperties: true, nullable: true })

export class AdmissionLandingPublishedResponseDto {
  @nullableObject() hero!: Record<string, unknown> | null
  @nullableObject() life!: Record<string, unknown> | null
  @nullableObject() info!: Record<string, unknown> | null
  @nullableObject() steps!: Record<string, unknown> | null
  @nullableObject() faq!: Record<string, unknown> | null
  @nullableObject() stories!: Record<string, unknown> | null
  @nullableObject() closing!: Record<string, unknown> | null

  static fromDomain(
    sections: Record<LandingSectionKey, unknown>,
  ): AdmissionLandingPublishedResponseDto {
    const dto = new AdmissionLandingPublishedResponseDto()
    for (const key of LANDING_SECTION_KEYS) {
      dto[key] = (sections[key] as Record<string, unknown> | null) ?? null
    }
    return dto
  }
}

export class AdmissionLandingDraftSectionsDto {
  @nullableObject() hero!: Record<string, unknown> | null
  @nullableObject() life!: Record<string, unknown> | null
  @nullableObject() info!: Record<string, unknown> | null
  @nullableObject() steps!: Record<string, unknown> | null
  @nullableObject() faq!: Record<string, unknown> | null
  @nullableObject() stories!: Record<string, unknown> | null
  @nullableObject() closing!: Record<string, unknown> | null
}

export class AdmissionLandingDraftResponseDto {
  @ApiProperty({ type: () => AdmissionLandingDraftSectionsDto })
  sections!: AdmissionLandingDraftSectionsDto

  @ApiProperty({ type: Boolean })
  hasUnpublishedChanges!: boolean

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: string | null

  static fromDomain(
    overview: LandingOverview,
  ): AdmissionLandingDraftResponseDto {
    const dto = new AdmissionLandingDraftResponseDto()
    const sections = new AdmissionLandingDraftSectionsDto()
    for (const key of LANDING_SECTION_KEYS) {
      sections[key] =
        (overview.sections[key] as Record<string, unknown> | null) ?? null
    }
    dto.sections = sections
    dto.hasUnpublishedChanges = overview.hasUnpublishedChanges
    dto.publishedAt = overview.publishedAt?.toISOString() ?? null
    return dto
  }
}

export class AdmissionLandingImageResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  width!: number

  @ApiProperty({ type: Number })
  height!: number

  @ApiProperty({ type: Number })
  sizeBytes!: number

  static fromDomain(
    image: LandingImageEntity,
  ): AdmissionLandingImageResponseDto {
    const dto = new AdmissionLandingImageResponseDto()
    dto.id = image.id
    dto.width = image.width
    dto.height = image.height
    dto.sizeBytes = image.sizeBytes
    return dto
  }
}
