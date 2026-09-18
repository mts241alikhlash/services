import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { PromotionAction } from '../../../../domain/enums/promotion-action.enum.js'

export class PromotionStudentDto {
  @ApiProperty({ description: 'Student ID', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string

  @ApiProperty({
    description: 'Source classroom ID from current semester',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceClassroomId: string

  @ApiProperty({
    description:
      'Classroom in the new academic year, required for both actions',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  targetClassroomId: string

  @ApiProperty({
    description: 'Promotion action',
    enum: PromotionAction,
    example: 'PROMOTE',
  })
  @IsEnum(PromotionAction)
  action: PromotionAction

  @ApiPropertyOptional({
    description: 'Reason for declining promotion (required when REPEAT)',
  })
  @IsOptional()
  @IsString()
  declineReason?: string
}

export class PromotionDto {
  @ApiProperty({
    description: 'Academic year the students are leaving, e.g. 2025/2026',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceAcademicYearId: string

  @ApiProperty({
    description: 'Academic year the students are entering, e.g. 2026/2027',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  targetAcademicYearId: string

  @ApiProperty({
    description: 'Per-student promotion decisions',
    type: [PromotionStudentDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PromotionStudentDto)
  students: PromotionStudentDto[]
}
