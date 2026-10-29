import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { PaginationQueryDto } from '../../../../shared/dto/pagination.dto.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamScoreRow } from '../../../application/use-cases/list-exam-scores/list-exam-scores.use-case.js'

export class ReceiveExamScoreDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() examSessionId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() enrollmentId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() studentId!: string
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  studentName?: string | null
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  studentNis?: string | null
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() gradeId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() classroomId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() semesterId!: string
  @ApiProperty() @IsString() @MaxLength(200) examTitle!: string
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) rawScore!: number
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) maxScore!: number
  @ApiProperty({ description: '0 to 100' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number
  @ApiProperty({ format: 'date-time' }) @IsDateString() gradedAt!: string
}

export class ExamScoreReceiptDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) examSessionId!: string

  static of(id: string, examSessionId: string): ExamScoreReceiptDto {
    const dto = new ExamScoreReceiptDto()
    dto.id = id
    dto.examSessionId = examSessionId
    return dto
  }
}

export class ExamScoreQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  semesterId?: string
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classroomId?: string
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string
}

export class ExamScoreDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) examSessionId!: string
  @ApiProperty({ format: 'uuid' }) studentId!: string
  @ApiProperty({ type: String, nullable: true }) studentName!: string | null
  @ApiProperty({ type: String, nullable: true }) studentNis!: string | null
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'uuid' }) classroomId!: string
  @ApiProperty({ type: String, nullable: true }) classroomName!: string | null
  @ApiProperty({ format: 'uuid' }) semesterId!: string
  @ApiProperty() examTitle!: string
  @ApiProperty() rawScore!: number
  @ApiProperty() maxScore!: number
  @ApiProperty({ description: '0 to 100' }) score!: number
  @ApiProperty({ format: 'date-time' }) gradedAt!: string

  static fromDomain(domain: ExamScoreRow): ExamScoreDto {
    const dto = new ExamScoreDto()
    dto.id = domain.id
    dto.examSessionId = domain.examSessionId
    dto.studentId = domain.studentId
    dto.studentName = domain.studentName
    dto.studentNis = domain.studentNis
    dto.subjectId = domain.subjectId
    dto.classroomId = domain.classroomId
    dto.classroomName = domain.classroomName
    dto.semesterId = domain.semesterId
    dto.examTitle = domain.examTitle
    dto.rawScore = domain.rawScore
    dto.maxScore = domain.maxScore
    dto.score = domain.score
    dto.gradedAt = domain.gradedAt.toISOString()
    return dto
  }
}

export class ExamScoreListResponseDto {
  @ApiProperty({ type: () => [ExamScoreDto] }) data!: ExamScoreDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(
    domain: PaginatedResult<ExamScoreRow>,
  ): ExamScoreListResponseDto {
    const dto = new ExamScoreListResponseDto()
    dto.data = domain.data.map((row) => ExamScoreDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
