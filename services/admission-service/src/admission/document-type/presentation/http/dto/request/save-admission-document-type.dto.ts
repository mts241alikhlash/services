import { ApiProperty, PartialType } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
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

export class UpdateAdmissionDocumentTypeDto extends PartialType(
  CreateAdmissionDocumentTypeDto,
) {}

export class ReorderAdmissionDocumentTypesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids!: string[]
}
