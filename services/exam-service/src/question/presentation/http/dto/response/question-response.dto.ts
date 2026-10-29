import { ApiProperty } from '@nestjs/swagger'
import type {
  QuestionDetail,
  QuestionVersion,
} from '../../../../domain/entities/question.entity.js'
import {
  QUESTION_TYPES,
  type QuestionType,
} from '../../../../domain/value-objects/question-content.js'
import type { QuestionScopeView } from '../../../../application/use-cases/get-question-scope/get-question-scope.use-case.js'

export class QuestionVersionDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) questionId!: string
  @ApiProperty() number!: number
  @ApiProperty() bodyHtml!: string
  @ApiProperty({ type: 'object', additionalProperties: true })
  content!: Record<string, unknown>
  @ApiProperty() points!: number
  @ApiProperty({ format: 'uuid' }) createdById!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: string

  static fromDomain(domain: QuestionVersion): QuestionVersionDto {
    const dto = new QuestionVersionDto()
    dto.id = domain.id
    dto.questionId = domain.questionId
    dto.number = domain.number
    dto.bodyHtml = domain.bodyHtml
    dto.content = domain.content as unknown as Record<string, unknown>
    dto.points = domain.points
    dto.createdById = domain.createdById
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class QuestionDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'uuid' }) gradeId!: string
  @ApiProperty({ format: 'uuid' }) authorEmployeeId!: string
  @ApiProperty({ enum: QUESTION_TYPES }) type!: QuestionType
  @ApiProperty({ format: 'uuid' }) packageId!: string
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  copiedFromQuestionId!: string | null
  @ApiProperty() currentVersion!: number
  @ApiProperty() revision!: number
  @ApiProperty({ format: 'uuid' }) createdById!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string
  @ApiProperty({ type: () => QuestionVersionDto }) current!: QuestionVersionDto

  static fromDomain(domain: QuestionDetail): QuestionDetailDto {
    const dto = new QuestionDetailDto()
    dto.id = domain.id
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.authorEmployeeId = domain.authorEmployeeId
    dto.type = domain.type
    dto.packageId = domain.packageId
    dto.copiedFromQuestionId = domain.copiedFromQuestionId
    dto.currentVersion = domain.currentVersion
    dto.revision = domain.revision
    dto.createdById = domain.createdById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.current = QuestionVersionDto.fromDomain(domain.current)
    return dto
  }
}

export class ScopePairDto {
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ type: String, nullable: true }) subjectName!: string | null
  @ApiProperty({ format: 'uuid' }) gradeId!: string
  @ApiProperty({ type: Number, nullable: true }) gradeLevel!: number | null
  @ApiProperty({ type: String, nullable: true }) gradeName!: string | null
}

export class QuestionScopeDto {
  @ApiProperty() all!: boolean
  @ApiProperty({ type: String, nullable: true }) employeeId!: string | null
  @ApiProperty({ type: () => [ScopePairDto] }) pairs!: ScopePairDto[]

  static fromDomain(domain: QuestionScopeView): QuestionScopeDto {
    const dto = new QuestionScopeDto()
    dto.all = domain.all
    dto.employeeId = domain.employeeId
    dto.pairs = domain.pairs.map((pair) =>
      Object.assign(new ScopePairDto(), pair),
    )
    return dto
  }
}
