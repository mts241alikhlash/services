import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'
import { PaginationQueryDto } from '../../../../../shared/dto/pagination.dto.js'
import {
  EXAM_PACKAGE_STATUSES,
  type ExamPackageStatus,
} from '../../../../domain/entities/exam-package.entity.js'

export const MAX_PACKAGE_QUESTIONS = 200

export class UpdateExamPackageDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Question ids; the array order is the position in the package',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PACKAGE_QUESTIONS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  questionIds!: string[]
}

export class CreateExamPackageDto extends UpdateExamPackageDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() gradeId!: string
}

export class ExamPackageQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  gradeId?: string

  @ApiPropertyOptional({ enum: EXAM_PACKAGE_STATUSES })
  @IsOptional()
  @IsIn(EXAM_PACKAGE_STATUSES)
  status?: ExamPackageStatus

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}

export class PackageCandidateQueryDto extends PaginationQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() gradeId!: string

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}
