import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
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
} from 'class-validator'
import {
  QUESTION_TYPES,
  type QuestionType,
} from '../../../../domain/value-objects/question-content.js'

export class CreateQuestionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() packageId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() gradeId!: string
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
