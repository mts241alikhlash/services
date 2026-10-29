import { ApiProperty } from '@nestjs/swagger'
import {
  QUESTION_TYPES,
  type QuestionType,
} from '../../../../../question/domain/value-objects/question-content.js'
import {
  EXAM_PACKAGE_STATUSES,
  type ExamPackage,
  type ExamPackageDetail,
  type ExamPackageStatus,
  type ExamPackageSummary,
  type ExamPackageView,
  type PackageItem,
  type PackageItemView,
  type PackageQuestionNote,
  type PackageReview,
  type PackageReviewAction,
} from '../../../../domain/entities/exam-package.entity.js'
import type { QuestionMarker } from '../../../../domain/policies/question-marker.policy.js'

abstract class ExamPackageBaseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() title!: string
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'uuid' }) gradeId!: string
  @ApiProperty({ enum: EXAM_PACKAGE_STATUSES }) status!: ExamPackageStatus
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lockedAt!: string | null
  @ApiProperty({ format: 'uuid' }) createdById!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string

  protected fill(domain: ExamPackage): void {
    this.id = domain.id
    this.title = domain.title
    this.subjectId = domain.subjectId
    this.gradeId = domain.gradeId
    this.status = domain.status
    this.lockedAt = domain.lockedAt ? domain.lockedAt.toISOString() : null
    this.createdById = domain.createdById
    this.createdAt = domain.createdAt.toISOString()
    this.updatedAt = domain.updatedAt.toISOString()
  }
}

export class ExamPackageItemDto {
  @ApiProperty({ format: 'uuid' }) questionId!: string
  @ApiProperty() questionVersion!: number
  @ApiProperty() position!: number

  static fromDomain(domain: PackageItem): ExamPackageItemDto {
    const dto = new ExamPackageItemDto()
    dto.questionId = domain.questionId
    dto.questionVersion = domain.questionVersion
    dto.position = domain.position
    return dto
  }
}

export class ExamPackageItemViewDto extends ExamPackageItemDto {
  @ApiProperty({ enum: QUESTION_TYPES }) type!: QuestionType
  @ApiProperty({ enum: ['NEW', 'CHANGED', 'COPIED'] }) marker!: QuestionMarker
  @ApiProperty() summary!: string
  @ApiProperty() points!: number

  static fromView(domain: PackageItemView): ExamPackageItemViewDto {
    const dto = new ExamPackageItemViewDto()
    dto.questionId = domain.questionId
    dto.questionVersion = domain.questionVersion
    dto.position = domain.position
    dto.type = domain.type
    dto.marker = domain.marker
    dto.summary = domain.summary
    dto.points = domain.points
    return dto
  }
}

export class ExamPackageSummaryDto extends ExamPackageBaseDto {
  @ApiProperty() itemCount!: number

  static fromDomain(domain: ExamPackageSummary): ExamPackageSummaryDto {
    const dto = new ExamPackageSummaryDto()
    dto.fill(domain)
    dto.itemCount = domain.itemCount
    return dto
  }
}

export class ExamPackageDetailDto extends ExamPackageBaseDto {
  @ApiProperty({ type: () => [ExamPackageItemDto] })
  items!: ExamPackageItemDto[]

  static fromDomain(domain: ExamPackageDetail): ExamPackageDetailDto {
    const dto = new ExamPackageDetailDto()
    dto.fill(domain)
    dto.items = domain.items.map((item) => ExamPackageItemDto.fromDomain(item))
    return dto
  }
}

export class PackageQuestionNoteResponseDto {
  @ApiProperty({ format: 'uuid' }) questionId!: string
  @ApiProperty() note!: string
}

export class PackageReviewDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ enum: ['SUBMIT', 'APPROVE', 'RETURN'] })
  action!: PackageReviewAction
  @ApiProperty({ format: 'uuid' }) byUserId!: string
  @ApiProperty({ type: String, nullable: true }) note!: string | null
  @ApiProperty({ type: () => [PackageQuestionNoteResponseDto] })
  questionNotes!: PackageQuestionNote[]
  @ApiProperty({ format: 'date-time' }) createdAt!: string

  static fromDomain(domain: PackageReview): PackageReviewDto {
    const dto = new PackageReviewDto()
    dto.id = domain.id
    dto.action = domain.action
    dto.byUserId = domain.byUserId
    dto.note = domain.note
    dto.questionNotes = domain.questionNotes
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class ExamPackageViewDto extends ExamPackageBaseDto {
  @ApiProperty({ type: () => [ExamPackageItemViewDto] })
  items!: ExamPackageItemViewDto[]

  @ApiProperty({ type: () => [PackageReviewDto] })
  reviews!: PackageReviewDto[]

  static fromDomain(domain: ExamPackageView): ExamPackageViewDto {
    const dto = new ExamPackageViewDto()
    dto.fill(domain)
    dto.items = domain.items.map((item) =>
      ExamPackageItemViewDto.fromView(item),
    )
    dto.reviews = domain.reviews.map((review) =>
      PackageReviewDto.fromDomain(review),
    )
    return dto
  }
}

export class ExamPackageListResponseDto {
  @ApiProperty({ type: () => [ExamPackageSummaryDto] })
  data!: ExamPackageSummaryDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(domain: {
    data: ExamPackageSummary[]
    total: number
    page: number
    limit: number
  }): ExamPackageListResponseDto {
    const dto = new ExamPackageListResponseDto()
    dto.data = domain.data.map((row) => ExamPackageSummaryDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
