import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { PaginationQueryDto } from '../../../../../shared/dto/pagination.dto.js'
import {
  QUESTION_TYPES,
  type QuestionType,
} from '../../../../../question/domain/value-objects/question-content.js'
import {
  EXAM_PACKAGE_STATUSES,
  type ExamPackageStatus,
} from '../../../../domain/entities/exam-package.entity.js'

export const MAX_PACKAGE_QUESTIONS = 200

export class RenameExamPackageDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string
}

export class CreateExamPackageDto extends RenameExamPackageDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() gradeId!: string
}

export class AddPackageQuestionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authorEmployeeId?: string

  @ApiProperty({ enum: QUESTION_TYPES })
  @IsIn(QUESTION_TYPES)
  type!: QuestionType

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(20000) bodyHtml!: string

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  content!: Record<string, unknown>

  @ApiProperty({ minimum: 0.25, maximum: 100 })
  @IsNumber()
  @Min(0.25)
  @Max(100)
  points!: number
}

export class ReorderPackageQuestionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Every question of the package, in the new order',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PACKAGE_QUESTIONS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  questionIds!: string[]
}

export class TakePackageQuestionsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() sourcePackageId!: string

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PACKAGE_QUESTIONS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  questionIds!: string[]
}

export class ApproveExamPackageDto {
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string
}

export class PackageQuestionNoteDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() questionId!: string

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note!: string
}

export class ReturnExamPackageDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note!: string

  @ApiProperty({ type: () => [PackageQuestionNoteDto] })
  @IsArray()
  @ArrayMaxSize(MAX_PACKAGE_QUESTIONS)
  @ValidateNested({ each: true })
  @Type(() => PackageQuestionNoteDto)
  questionNotes!: PackageQuestionNoteDto[]
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
