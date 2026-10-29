import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator'
import { PaginationQueryDto } from '../../../../shared/dto/pagination.dto.js'
import { EXAM_SESSION_STATUSES } from '../../../../exam-session/domain/entities/exam-session.entity.js'
import type { ExamSessionStatus } from '../../../../exam-session/domain/entities/exam-session.entity.js'

export class GradingScheduleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Defaults to the active semester',
  })
  @IsOptional()
  @IsUUID()
  semesterId?: string
}

export class GradingSessionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EXAM_SESSION_STATUSES })
  @IsOptional()
  @IsEnum(EXAM_SESSION_STATUSES)
  status?: ExamSessionStatus
}

export class GradeAnswerDto {
  @ApiProperty({ description: 'From 0 up to the points of the question' })
  @IsNumber()
  @Min(0)
  score!: number

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string
}
