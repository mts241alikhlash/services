import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { PaginationQueryDto } from '../../../../../shared/dto/pagination.dto.js'
import {
  QUESTION_STATUSES,
  QUESTION_TYPES,
  type QuestionStatus,
  type QuestionType,
} from '../../../../domain/value-objects/question-content.js'

export class AuthorsQueryDto {
  @ApiPropertyOptional({ enum: QUESTION_STATUSES })
  @IsOptional()
  @IsIn(QUESTION_STATUSES)
  status?: QuestionStatus
}

export class QuestionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  gradeId?: string

  @ApiPropertyOptional({ enum: QUESTION_TYPES })
  @IsOptional()
  @IsIn(QUESTION_TYPES)
  type?: QuestionType

  @ApiPropertyOptional({ enum: QUESTION_STATUSES })
  @IsOptional()
  @IsIn(QUESTION_STATUSES)
  status?: QuestionStatus

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authorEmployeeId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}
