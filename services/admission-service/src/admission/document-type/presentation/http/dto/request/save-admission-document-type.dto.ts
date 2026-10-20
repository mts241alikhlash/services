import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator'
import type { DocumentRequirement } from '../../../../domain/entities/admission-document-type.entity.js'

const REQUIREMENTS = ['REQUIRED', 'LATER', 'OPTIONAL'] as const

export class CreateAdmissionDocumentTypeDto {
  @ApiProperty({ example: 'Surat Keterangan Sehat' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @ApiPropertyOptional({ enum: REQUIREMENTS })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(REQUIREMENTS)
  requirement?: DocumentRequirement

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 1,
    maximum: 12,
    description: 'Months after the start of the school year; LATER only',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(12)
  lateDueMonths?: number | null

  @ApiPropertyOptional({
    description:
      'Deprecated: use requirement. true is REQUIRED, false OPTIONAL.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isRequired?: boolean

  @ApiProperty()
  @IsBoolean()
  isActive!: boolean
}

export class UpdateAdmissionDocumentTypeDto {
  @ApiPropertyOptional({ example: 'Surat Keterangan Sehat' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ enum: REQUIREMENTS })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(REQUIREMENTS)
  requirement?: DocumentRequirement

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 1,
    maximum: 12,
    description: 'Months after the start of the school year; LATER only',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(12)
  lateDueMonths?: number | null

  @ApiPropertyOptional({
    description:
      'Deprecated: use requirement. true is REQUIRED, false OPTIONAL.',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isRequired?: boolean

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean
}

export class ReorderAdmissionDocumentTypesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[]
}
