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

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return value
}

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
  @Transform(toBoolean)
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
  @Transform(toBoolean)
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
