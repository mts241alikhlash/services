import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'
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
