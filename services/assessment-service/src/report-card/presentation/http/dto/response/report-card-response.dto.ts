import type { GetReportCardDetailUseCase } from '../../../../application/use-cases/get-report-card-detail/get-report-card-detail.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ReportCardWithDetails } from '../../../../domain/entities/report-card.entity.js'
import type { ReportCardSummary } from '../../../../domain/repositories/report-card.repository.js'

export class ReportCardResponseSubjectsDto {
  @ApiProperty({ type: String })
  subjectId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  subjectCode?: string | null

  @ApiProperty({ type: String })
  subjectName!: string

  @ApiProperty({ type: Number })
  score!: number

  @ApiProperty({ type: Number })
  passingScore!: number

  @ApiProperty({ type: String })
  predicate!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: Boolean })
  isComplete!: boolean

  @ApiPropertyOptional({ type: String })
  id?: string

  @ApiPropertyOptional({ type: String })
  reportCardId?: string

  static fromDomain(
    domain: NonNullable<NonNullable<ReportCardWithDetails['subjects']>[number]>,
  ): ReportCardResponseSubjectsDto {
    const dto = new ReportCardResponseSubjectsDto()
    dto.subjectId = domain.subjectId
    dto.subjectCode = domain.subjectCode
    dto.subjectName = domain.subjectName
    dto.score = domain.score
    dto.passingScore = domain.passingScore
    dto.predicate = domain.predicate
    dto.description = domain.description
    dto.isComplete = domain.isComplete
    dto.id = domain.id
    dto.reportCardId = domain.reportCardId
    return dto
  }
}

export class ReportCardResponseEnrollmentStudentUserProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<ReportCardWithDetails['enrollment']>['student']
        >['user']
      >['profile']
    >,
  ): ReportCardResponseEnrollmentStudentUserProfileDto {
    const dto = new ReportCardResponseEnrollmentStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ReportCardResponseEnrollmentStudentUserDto {
  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentStudentUserProfileDto,
    nullable: true,
  })
  profile?: ReportCardResponseEnrollmentStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<ReportCardWithDetails['enrollment']>['student']
      >['user']
    >,
  ): ReportCardResponseEnrollmentStudentUserDto {
    const dto = new ReportCardResponseEnrollmentStudentUserDto()
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ReportCardResponseEnrollmentStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ReportCardResponseEnrollmentStudentDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  nis?: string | null

  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentStudentUserDto,
    nullable: true,
  })
  user?: ReportCardResponseEnrollmentStudentUserDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<ReportCardWithDetails['enrollment']>['student']
    >,
  ): ReportCardResponseEnrollmentStudentDto {
    const dto = new ReportCardResponseEnrollmentStudentDto()
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ReportCardResponseEnrollmentStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class ReportCardResponseEnrollmentClassroomDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  code?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<ReportCardWithDetails['enrollment']>['classroom']
    >,
  ): ReportCardResponseEnrollmentClassroomDto {
    const dto = new ReportCardResponseEnrollmentClassroomDto()
    dto.name = domain.name
    dto.code = domain.code
    return dto
  }
}

export class ReportCardResponseEnrollmentSemesterTypeDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<ReportCardWithDetails['enrollment']>['semester']
      >['type']
    >,
  ): ReportCardResponseEnrollmentSemesterTypeDto {
    const dto = new ReportCardResponseEnrollmentSemesterTypeDto()
    dto.name = domain.name
    return dto
  }
}

export class ReportCardResponseEnrollmentSemesterAcademicYearDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<ReportCardWithDetails['enrollment']>['semester']
      >['academicYear']
    >,
  ): ReportCardResponseEnrollmentSemesterAcademicYearDto {
    const dto = new ReportCardResponseEnrollmentSemesterAcademicYearDto()
    dto.name = domain.name
    return dto
  }
}

export class ReportCardResponseEnrollmentSemesterDto {
  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentSemesterTypeDto,
    nullable: true,
  })
  type?: ReportCardResponseEnrollmentSemesterTypeDto | null

  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentSemesterAcademicYearDto,
    nullable: true,
  })
  academicYear?: ReportCardResponseEnrollmentSemesterAcademicYearDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<ReportCardWithDetails['enrollment']>['semester']
    >,
  ): ReportCardResponseEnrollmentSemesterDto {
    const dto = new ReportCardResponseEnrollmentSemesterDto()
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : ReportCardResponseEnrollmentSemesterTypeDto.fromDomain(domain.type)
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : ReportCardResponseEnrollmentSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class ReportCardResponseEnrollmentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentStudentDto,
    nullable: true,
  })
  student?: ReportCardResponseEnrollmentStudentDto | null

  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentClassroomDto,
    nullable: true,
  })
  classroom?: ReportCardResponseEnrollmentClassroomDto | null

  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentSemesterDto,
    nullable: true,
  })
  semester?: ReportCardResponseEnrollmentSemesterDto | null

  static fromDomain(
    domain: NonNullable<ReportCardWithDetails['enrollment']>,
  ): ReportCardResponseEnrollmentDto {
    const dto = new ReportCardResponseEnrollmentDto()
    dto.id = domain.id
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : ReportCardResponseEnrollmentStudentDto.fromDomain(domain.student)
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ReportCardResponseEnrollmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : ReportCardResponseEnrollmentSemesterDto.fromDomain(domain.semester)
    return dto
  }
}

export class ReportCardResponseScoresDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assessmentItemId!: string

  @ApiProperty({ type: Number, nullable: true })
  score!: number | null

  static fromDomain(
    domain: NonNullable<NonNullable<ReportCardWithDetails['scores']>[number]>,
  ): ReportCardResponseScoresDto {
    const dto = new ReportCardResponseScoresDto()
    dto.id = domain.id
    dto.assessmentItemId = domain.assessmentItemId
    dto.score = domain.score
    return dto
  }
}

export class ReportCardResponseDto {
  @ApiPropertyOptional({
    type: () => ReportCardResponseSubjectsDto,
    isArray: true,
  })
  subjects?: ReportCardResponseSubjectsDto[]

  @ApiPropertyOptional({
    type: () => ReportCardResponseEnrollmentDto,
    nullable: true,
  })
  enrollment?: ReportCardResponseEnrollmentDto | null

  @ApiPropertyOptional({
    type: () => ReportCardResponseScoresDto,
    isArray: true,
  })
  scores?: ReportCardResponseScoresDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  studentEnrollmentId?: string

  @ApiPropertyOptional({ type: String })
  enrollmentId?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  academicSummary?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  extracurricularNotes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  employeeNotes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  employeeNote?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  totalAverage?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  rank?: number | null

  @ApiPropertyOptional({ type: Boolean })
  isPublished?: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: ReportCardWithDetails): ReportCardResponseDto {
    const dto = new ReportCardResponseDto()
    if (domain.subjects !== undefined)
      dto.subjects =
        domain.subjects == null
          ? domain.subjects
          : domain.subjects.map((x) =>
              ReportCardResponseSubjectsDto.fromDomain(x),
            )
    if (domain.enrollment !== undefined)
      dto.enrollment =
        domain.enrollment == null
          ? domain.enrollment
          : ReportCardResponseEnrollmentDto.fromDomain(domain.enrollment)
    if (domain.scores !== undefined)
      dto.scores =
        domain.scores == null
          ? domain.scores
          : domain.scores.map((x) => ReportCardResponseScoresDto.fromDomain(x))
    dto.id = domain.id
    dto.studentEnrollmentId = domain.studentEnrollmentId
    dto.enrollmentId = domain.enrollmentId
    dto.academicSummary = domain.academicSummary
    dto.extracurricularNotes = domain.extracurricularNotes
    dto.employeeNotes = domain.employeeNotes
    dto.employeeNote = domain.employeeNote
    dto.totalAverage = domain.totalAverage
    dto.rank = domain.rank
    dto.isPublished = domain.isPublished
    if (domain.publishedAt !== undefined)
      dto.publishedAt =
        domain.publishedAt == null
          ? domain.publishedAt
          : domain.publishedAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class ReportCardListResponseSummaryDto {
  @ApiProperty({ type: Number })
  published!: number

  @ApiProperty({ type: Number })
  draft!: number

  @ApiProperty({ type: Number, nullable: true })
  averageScore!: number | null

  static fromDomain(
    domain: ReportCardSummary,
  ): ReportCardListResponseSummaryDto {
    const dto = new ReportCardListResponseSummaryDto()
    dto.published = domain.published
    dto.draft = domain.draft
    dto.averageScore = domain.averageScore
    return dto
  }
}

export class ReportCardListResponseDto {
  @ApiProperty({ type: () => [ReportCardResponseDto] })
  data!: ReportCardResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiPropertyOptional({ type: () => ReportCardListResponseSummaryDto })
  summary?: ReportCardListResponseSummaryDto

  static fromDomain(domain: {
    data: ReportCardWithDetails[]
    total: number
    page: number
    limit: number
    summary?: ReportCardSummary
  }): ReportCardListResponseDto {
    const dto = new ReportCardListResponseDto()
    dto.data = domain.data.map((item) => ReportCardResponseDto.fromDomain(item))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    if (domain.summary !== undefined)
      dto.summary = ReportCardListResponseSummaryDto.fromDomain(domain.summary)
    return dto
  }
}

export class ReportCardDetailResponseAttendanceDto {
  @ApiProperty({ type: Number })
  SICK!: number

  @ApiProperty({ type: Number })
  EXCUSED!: number

  @ApiProperty({ type: Number })
  ABSENT!: number

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['attendance']
    >,
  ): ReportCardDetailResponseAttendanceDto {
    const dto = new ReportCardDetailResponseAttendanceDto()
    dto.SICK = domain.SICK
    dto.EXCUSED = domain.EXCUSED
    dto.ABSENT = domain.ABSENT
    return dto
  }
}

export class ReportCardDetailResponseSubjectsDto {
  @ApiProperty({ type: String })
  subjectId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  subjectCode?: string | null

  @ApiProperty({ type: String })
  subjectName!: string

  @ApiProperty({ type: Number })
  score!: number

  @ApiProperty({ type: Number })
  passingScore!: number

  @ApiProperty({ type: String })
  predicate!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: Boolean })
  isComplete!: boolean

  @ApiPropertyOptional({ type: String })
  id?: string

  @ApiPropertyOptional({ type: String })
  reportCardId?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['subjects']
      >[number]
    >,
  ): ReportCardDetailResponseSubjectsDto {
    const dto = new ReportCardDetailResponseSubjectsDto()
    dto.subjectId = domain.subjectId
    dto.subjectCode = domain.subjectCode
    dto.subjectName = domain.subjectName
    dto.score = domain.score
    dto.passingScore = domain.passingScore
    dto.predicate = domain.predicate
    dto.description = domain.description
    dto.isComplete = domain.isComplete
    dto.id = domain.id
    dto.reportCardId = domain.reportCardId
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentStudentUserProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            Awaited<
              ReturnType<GetReportCardDetailUseCase['execute']>
            >['enrollment']
          >['student']
        >['user']
      >['profile']
    >,
  ): ReportCardDetailResponseEnrollmentStudentUserProfileDto {
    const dto = new ReportCardDetailResponseEnrollmentStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentStudentUserDto {
  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentStudentUserProfileDto,
    nullable: true,
  })
  profile?: ReportCardDetailResponseEnrollmentStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetReportCardDetailUseCase['execute']>
          >['enrollment']
        >['student']
      >['user']
    >,
  ): ReportCardDetailResponseEnrollmentStudentUserDto {
    const dto = new ReportCardDetailResponseEnrollmentStudentUserDto()
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ReportCardDetailResponseEnrollmentStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentStudentDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  nis?: string | null

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentStudentUserDto,
    nullable: true,
  })
  user?: ReportCardDetailResponseEnrollmentStudentUserDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['enrollment']
      >['student']
    >,
  ): ReportCardDetailResponseEnrollmentStudentDto {
    const dto = new ReportCardDetailResponseEnrollmentStudentDto()
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ReportCardDetailResponseEnrollmentStudentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentClassroomDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  code?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['enrollment']
      >['classroom']
    >,
  ): ReportCardDetailResponseEnrollmentClassroomDto {
    const dto = new ReportCardDetailResponseEnrollmentClassroomDto()
    dto.name = domain.name
    dto.code = domain.code
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentSemesterTypeDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetReportCardDetailUseCase['execute']>
          >['enrollment']
        >['semester']
      >['type']
    >,
  ): ReportCardDetailResponseEnrollmentSemesterTypeDto {
    const dto = new ReportCardDetailResponseEnrollmentSemesterTypeDto()
    dto.name = domain.name
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentSemesterAcademicYearDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetReportCardDetailUseCase['execute']>
          >['enrollment']
        >['semester']
      >['academicYear']
    >,
  ): ReportCardDetailResponseEnrollmentSemesterAcademicYearDto {
    const dto = new ReportCardDetailResponseEnrollmentSemesterAcademicYearDto()
    dto.name = domain.name
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentSemesterDto {
  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentSemesterTypeDto,
    nullable: true,
  })
  type?: ReportCardDetailResponseEnrollmentSemesterTypeDto | null

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentSemesterAcademicYearDto,
    nullable: true,
  })
  academicYear?: ReportCardDetailResponseEnrollmentSemesterAcademicYearDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['enrollment']
      >['semester']
    >,
  ): ReportCardDetailResponseEnrollmentSemesterDto {
    const dto = new ReportCardDetailResponseEnrollmentSemesterDto()
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : ReportCardDetailResponseEnrollmentSemesterTypeDto.fromDomain(
              domain.type,
            )
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : ReportCardDetailResponseEnrollmentSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class ReportCardDetailResponseEnrollmentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentStudentDto,
    nullable: true,
  })
  student?: ReportCardDetailResponseEnrollmentStudentDto | null

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentClassroomDto,
    nullable: true,
  })
  classroom?: ReportCardDetailResponseEnrollmentClassroomDto | null

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentSemesterDto,
    nullable: true,
  })
  semester?: ReportCardDetailResponseEnrollmentSemesterDto | null

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['enrollment']
    >,
  ): ReportCardDetailResponseEnrollmentDto {
    const dto = new ReportCardDetailResponseEnrollmentDto()
    dto.id = domain.id
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : ReportCardDetailResponseEnrollmentStudentDto.fromDomain(
              domain.student,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ReportCardDetailResponseEnrollmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : ReportCardDetailResponseEnrollmentSemesterDto.fromDomain(
              domain.semester,
            )
    return dto
  }
}

export class ReportCardDetailResponseScoresDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assessmentItemId!: string

  @ApiProperty({ type: Number, nullable: true })
  score!: number | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>['scores']
      >[number]
    >,
  ): ReportCardDetailResponseScoresDto {
    const dto = new ReportCardDetailResponseScoresDto()
    dto.id = domain.id
    dto.assessmentItemId = domain.assessmentItemId
    dto.score = domain.score
    return dto
  }
}

export class ReportCardDetailResponseDto {
  @ApiProperty({ type: () => ReportCardDetailResponseAttendanceDto })
  attendance!: ReportCardDetailResponseAttendanceDto

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseSubjectsDto,
    isArray: true,
  })
  subjects?: ReportCardDetailResponseSubjectsDto[]

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseEnrollmentDto,
    nullable: true,
  })
  enrollment?: ReportCardDetailResponseEnrollmentDto | null

  @ApiPropertyOptional({
    type: () => ReportCardDetailResponseScoresDto,
    isArray: true,
  })
  scores?: ReportCardDetailResponseScoresDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  studentEnrollmentId?: string

  @ApiPropertyOptional({ type: String })
  enrollmentId?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  academicSummary?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  extracurricularNotes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  employeeNotes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  employeeNote?: string | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  totalAverage?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  rank?: number | null

  @ApiPropertyOptional({ type: Boolean })
  isPublished?: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: Awaited<ReturnType<GetReportCardDetailUseCase['execute']>>,
  ): ReportCardDetailResponseDto {
    const dto = new ReportCardDetailResponseDto()
    dto.attendance = ReportCardDetailResponseAttendanceDto.fromDomain(
      domain.attendance,
    )
    if (domain.subjects !== undefined)
      dto.subjects =
        domain.subjects == null
          ? domain.subjects
          : domain.subjects.map((x) =>
              ReportCardDetailResponseSubjectsDto.fromDomain(x),
            )
    if (domain.enrollment !== undefined)
      dto.enrollment =
        domain.enrollment == null
          ? domain.enrollment
          : ReportCardDetailResponseEnrollmentDto.fromDomain(domain.enrollment)
    if (domain.scores !== undefined)
      dto.scores =
        domain.scores == null
          ? domain.scores
          : domain.scores.map((x) =>
              ReportCardDetailResponseScoresDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.studentEnrollmentId = domain.studentEnrollmentId
    dto.enrollmentId = domain.enrollmentId
    dto.academicSummary = domain.academicSummary
    dto.extracurricularNotes = domain.extracurricularNotes
    dto.employeeNotes = domain.employeeNotes
    dto.employeeNote = domain.employeeNote
    dto.totalAverage = domain.totalAverage
    dto.rank = domain.rank
    dto.isPublished = domain.isPublished
    if (domain.publishedAt !== undefined)
      dto.publishedAt =
        domain.publishedAt == null
          ? domain.publishedAt
          : domain.publishedAt.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}
