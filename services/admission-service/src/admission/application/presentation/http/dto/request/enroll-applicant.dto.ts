import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class EnrollApplicantDto {
  @ApiPropertyOptional({ example: '262707001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nis?: string

  @ApiPropertyOptional({ example: '0091234567' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nisn?: string

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Defaults to the grade the applicant chose',
  })
  @IsOptional()
  @IsUUID()
  gradeId?: string

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'When set, the student is enrolled into this classroom for the active semester',
  })
  @IsOptional()
  @IsUUID()
  classroomId?: string
}
