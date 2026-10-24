import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type {
  QuestionDetail,
  QuestionReview,
  QuestionVersion,
} from '../../../../domain/entities/question.entity.js'
import {
  QUESTION_STATUSES,
  QUESTION_TYPES,
  type QuestionStatus,
  type QuestionType,
} from '../../../../domain/value-objects/question-content.js'
import type { QuestionScopeView } from '../../../../application/use-cases/get-question-scope/get-question-scope.use-case.js'
import type { QuestionSummary } from '../../../../domain/repositories/question.repository.js'

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

export class QuestionReviewDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) questionId!: string
  @ApiProperty() versionNumber!: number
  @ApiProperty({ enum: ['SUBMITTED', 'APPROVED', 'RETURNED'] })
  action!: QuestionReview['action']
  @ApiProperty({ type: String, nullable: true }) note!: string | null
  @ApiProperty({ format: 'uuid' }) byUserId!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: string

  static fromDomain(domain: QuestionReview): QuestionReviewDto {
    const dto = new QuestionReviewDto()
    dto.id = domain.id
    dto.questionId = domain.questionId
    dto.versionNumber = domain.versionNumber
    dto.action = domain.action
    dto.note = domain.note
    dto.byUserId = domain.byUserId
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class QuestionSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'uuid' }) gradeId!: string
  @ApiProperty({ format: 'uuid' }) authorEmployeeId!: string
  @ApiProperty({ enum: QUESTION_TYPES }) type!: QuestionType
  @ApiProperty({ enum: QUESTION_STATUSES }) status!: QuestionStatus
  @ApiProperty() currentVersion!: number
  @ApiProperty({ type: Number, nullable: true }) approvedVersion!: number | null
  @ApiProperty() revision!: number
  @ApiProperty() bodyHtml!: string
  @ApiProperty() points!: number
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string

  static fromDomain(domain: QuestionSummary): QuestionSummaryDto {
    const dto = new QuestionSummaryDto()
    dto.id = domain.id
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.authorEmployeeId = domain.authorEmployeeId
    dto.type = domain.type
    dto.status = domain.status
    dto.currentVersion = domain.currentVersion
    dto.approvedVersion = domain.approvedVersion
    dto.revision = domain.revision
    dto.bodyHtml = domain.bodyHtml
    dto.points = domain.points
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class QuestionDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'uuid' }) gradeId!: string
  @ApiProperty({ format: 'uuid' }) authorEmployeeId!: string
  @ApiProperty({ enum: QUESTION_TYPES }) type!: QuestionType
  @ApiProperty({ enum: QUESTION_STATUSES }) status!: QuestionStatus
  @ApiProperty() currentVersion!: number
  @ApiProperty({ type: Number, nullable: true }) approvedVersion!: number | null
  @ApiProperty() revision!: number
  @ApiProperty({ format: 'uuid' }) createdById!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string
  @ApiProperty({ type: () => QuestionVersionDto }) current!: QuestionVersionDto
  @ApiProperty({ type: () => QuestionVersionDto, nullable: true })
  approved!: QuestionVersionDto | null
  @ApiProperty({ type: () => [QuestionReviewDto] })
  reviews!: QuestionReviewDto[]

  static fromDomain(domain: QuestionDetail): QuestionDetailDto {
    const dto = new QuestionDetailDto()
    dto.id = domain.id
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.authorEmployeeId = domain.authorEmployeeId
    dto.type = domain.type
    dto.status = domain.status
    dto.currentVersion = domain.currentVersion
    dto.approvedVersion = domain.approvedVersion
    dto.revision = domain.revision
    dto.createdById = domain.createdById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    dto.current = QuestionVersionDto.fromDomain(domain.current)
    dto.approved = domain.approved
      ? QuestionVersionDto.fromDomain(domain.approved)
      : null
    dto.reviews = domain.reviews.map((review) =>
      QuestionReviewDto.fromDomain(review),
    )
    return dto
  }
}

export class QuestionListResponseDto {
  @ApiProperty({ type: () => [QuestionSummaryDto] })
  data!: QuestionSummaryDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(domain: {
    data: QuestionSummary[]
    total: number
    page: number
    limit: number
  }): QuestionListResponseDto {
    const dto = new QuestionListResponseDto()
    dto.data = domain.data.map((row) => QuestionSummaryDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
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
  @ApiProperty({ type: () => [ScopePairDto] }) pairs!: ScopePairDto[]

  static fromDomain(domain: QuestionScopeView): QuestionScopeDto {
    const dto = new QuestionScopeDto()
    dto.all = domain.all
    dto.pairs = domain.pairs.map((pair) =>
      Object.assign(new ScopePairDto(), pair),
    )
    return dto
  }
}

export class ApprovalResultDto {
  @ApiProperty({ type: String }) id!: string
  @ApiProperty() ok!: boolean
  @ApiPropertyOptional({ type: String }) reason?: string
}

export class ApproveManyResponseDto {
  @ApiProperty({ type: () => [ApprovalResultDto] })
  data!: ApprovalResultDto[]

  static fromDomain(
    results: { id: string; ok: boolean; reason?: string }[],
  ): ApproveManyResponseDto {
    const dto = new ApproveManyResponseDto()
    dto.data = results.map((result) => {
      const row = new ApprovalResultDto()
      row.id = result.id
      row.ok = result.ok
      if (result.reason !== undefined) row.reason = result.reason
      return row
    })
    return dto
  }
}
