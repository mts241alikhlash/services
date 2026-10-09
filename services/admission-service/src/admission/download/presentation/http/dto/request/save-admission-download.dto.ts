import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'
import { toBooleanFromTransform } from '../../../../../../shared/validators/boolean.transformer.js'

export class CreateAdmissionDownloadDto {
  @ApiProperty({ example: 'Brosur PPDB 2026/2027' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string

  @ApiPropertyOptional({ example: 'Informasi biaya dan jadwal.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBooleanFromTransform)
  @IsBoolean()
  isActive?: boolean
}

export class UpdateAdmissionDownloadDto {
  @ApiPropertyOptional({ example: 'Brosur PPDB 2026/2027' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string

  @ApiPropertyOptional({ example: 'Informasi biaya dan jadwal.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBooleanFromTransform)
  @IsBoolean()
  isActive?: boolean
}

export class ReorderAdmissionDownloadsDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[]
}
