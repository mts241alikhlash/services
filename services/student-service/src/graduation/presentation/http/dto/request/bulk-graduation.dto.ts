import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export class BulkGraduationStudentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string

  @ApiPropertyOptional({ example: 'DN-01/2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  certificateNo?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

export class BulkGraduationHeldStudentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string

  @ApiProperty({ example: 'Nilai belum lengkap' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string
}

export class BulkGraduationDto {
  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  graduationDate?: string

  @ApiProperty({ type: [BulkGraduationStudentDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => BulkGraduationStudentDto)
  students: BulkGraduationStudentDto[]

  @ApiPropertyOptional({ type: [BulkGraduationHeldStudentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => BulkGraduationHeldStudentDto)
  held?: BulkGraduationHeldStudentDto[]
}
