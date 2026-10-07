import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator'

export class CreateAdmissionDocumentTypeDto {
  @ApiProperty({ example: 'Surat Keterangan Sehat' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @ApiProperty()
  @IsBoolean()
  isRequired!: boolean

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

  @ApiPropertyOptional()
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
