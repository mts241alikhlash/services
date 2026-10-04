import type { BulkUpsertResult } from '../../../../domain/repositories/student-score.repository.js'
import type { GetStudentScoreRosterUseCase } from '../../../../application/use-cases/get-student-score-roster/get-student-score-roster.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { StudentScoreWithDetails } from '../../../../domain/entities/student-score.entity.js'

export class StudentScoreResponseAssessmentItemTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          StudentScoreWithDetails['assessmentItem']
        >['teachingAssignment']
      >['subject']
    >,
  ): StudentScoreResponseAssessmentItemTeachingAssignmentSubjectDto {
    const dto =
      new StudentScoreResponseAssessmentItemTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class StudentScoreResponseAssessmentItemTeachingAssignmentClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          StudentScoreWithDetails['assessmentItem']
        >['teachingAssignment']
      >['classroom']
    >,
  ): StudentScoreResponseAssessmentItemTeachingAssignmentClassroomDto {
    const dto =
      new StudentScoreResponseAssessmentItemTeachingAssignmentClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    return dto
  }
}

export class StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              StudentScoreWithDetails['assessmentItem']
            >['teachingAssignment']
          >['employee']
        >['user']
      >['profile']
    >,
  ): StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserProfileDto {
    const dto =
      new StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            StudentScoreWithDetails['assessmentItem']
          >['teachingAssignment']
        >['employee']
      >['user']
    >,
  ): StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserDto {
    const dto =
      new StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () =>
      StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserDto,
  })
  user?: StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          StudentScoreWithDetails['assessmentItem']
        >['teachingAssignment']
      >['employee']
    >,
  ): StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeDto {
    const dto =
      new StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class StudentScoreResponseAssessmentItemTeachingAssignmentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiProperty({ type: Number, nullable: true })
  passingScore!: number | null

  @ApiPropertyOptional({
    type: () => StudentScoreResponseAssessmentItemTeachingAssignmentSubjectDto,
  })
  subject?: StudentScoreResponseAssessmentItemTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () =>
      StudentScoreResponseAssessmentItemTeachingAssignmentClassroomDto,
  })
  classroom?: StudentScoreResponseAssessmentItemTeachingAssignmentClassroomDto

  @ApiPropertyOptional({
    type: () => StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeDto,
  })
  employee?: StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        StudentScoreWithDetails['assessmentItem']
      >['teachingAssignment']
    >,
  ): StudentScoreResponseAssessmentItemTeachingAssignmentDto {
    const dto = new StudentScoreResponseAssessmentItemTeachingAssignmentDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroomId = domain.classroomId
    dto.subjectId = domain.subjectId
    dto.semesterId = domain.semesterId
    dto.passingScore = domain.passingScore
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : StudentScoreResponseAssessmentItemTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : StudentScoreResponseAssessmentItemTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : StudentScoreResponseAssessmentItemTeachingAssignmentEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class StudentScoreResponseAssessmentItemCountDto {
  @ApiPropertyOptional({ type: Number })
  studentScores?: number

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentScoreWithDetails['assessmentItem']>['_count']
    >,
  ): StudentScoreResponseAssessmentItemCountDto {
    const dto = new StudentScoreResponseAssessmentItemCountDto()
    dto.studentScores = domain.studentScores
    return dto
  }
}

export class StudentScoreResponseAssessmentItemDto {
  @ApiPropertyOptional({
    type: () => StudentScoreResponseAssessmentItemTeachingAssignmentDto,
  })
  teachingAssignment?: StudentScoreResponseAssessmentItemTeachingAssignmentDto

  @ApiPropertyOptional({
    type: () => StudentScoreResponseAssessmentItemCountDto,
  })
  _count?: StudentScoreResponseAssessmentItemCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  teachingAssignmentId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({
    enum: ['DAILY', 'MIDTERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL'],
  })
  type!: 'DAILY' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT' | 'PRACTICAL'

  @ApiProperty({ type: Number })
  weight!: number

  @ApiProperty({ type: Number })
  maxScore!: number

  static fromDomain(
    domain: NonNullable<StudentScoreWithDetails['assessmentItem']>,
  ): StudentScoreResponseAssessmentItemDto {
    const dto = new StudentScoreResponseAssessmentItemDto()
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : StudentScoreResponseAssessmentItemTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : StudentScoreResponseAssessmentItemCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.name = domain.name
    dto.type = domain.type
    dto.weight = domain.weight
    dto.maxScore = domain.maxScore
    return dto
  }
}

export class StudentScoreResponseEnrollmentStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<StudentScoreWithDetails['enrollment']>['student']
        >['user']
      >['profile']
    >,
  ): StudentScoreResponseEnrollmentStudentUserProfileDto {
    const dto = new StudentScoreResponseEnrollmentStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentScoreResponseEnrollmentStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentScoreResponseEnrollmentStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentScoreResponseEnrollmentStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentScoreWithDetails['enrollment']>['student']
      >['user']
    >,
  ): StudentScoreResponseEnrollmentStudentUserDto {
    const dto = new StudentScoreResponseEnrollmentStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentScoreResponseEnrollmentStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentScoreResponseEnrollmentStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => StudentScoreResponseEnrollmentStudentUserDto,
  })
  user?: StudentScoreResponseEnrollmentStudentUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentScoreWithDetails['enrollment']>['student']
    >,
  ): StudentScoreResponseEnrollmentStudentDto {
    const dto = new StudentScoreResponseEnrollmentStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentScoreResponseEnrollmentStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class StudentScoreResponseEnrollmentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: () => StudentScoreResponseEnrollmentStudentDto })
  student?: StudentScoreResponseEnrollmentStudentDto

  static fromDomain(
    domain: NonNullable<StudentScoreWithDetails['enrollment']>,
  ): StudentScoreResponseEnrollmentDto {
    const dto = new StudentScoreResponseEnrollmentDto()
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentScoreResponseEnrollmentStudentDto.fromDomain(domain.student)
    return dto
  }
}

export class StudentScoreResponseDto {
  @ApiPropertyOptional({ type: () => StudentScoreResponseAssessmentItemDto })
  assessmentItem?: StudentScoreResponseAssessmentItemDto

  @ApiPropertyOptional({ type: () => StudentScoreResponseEnrollmentDto })
  enrollment?: StudentScoreResponseEnrollmentDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  enrollmentId!: string

  @ApiProperty({ type: String })
  assessmentItemId!: string

  @ApiProperty({ type: Number, nullable: true })
  score!: number | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  @ApiProperty({ type: String, nullable: true })
  correctedById!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  correctedAt!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: StudentScoreWithDetails): StudentScoreResponseDto {
    const dto = new StudentScoreResponseDto()
    if (domain.assessmentItem !== undefined)
      dto.assessmentItem =
        domain.assessmentItem == null
          ? domain.assessmentItem
          : StudentScoreResponseAssessmentItemDto.fromDomain(
              domain.assessmentItem,
            )
    if (domain.enrollment !== undefined)
      dto.enrollment =
        domain.enrollment == null
          ? domain.enrollment
          : StudentScoreResponseEnrollmentDto.fromDomain(domain.enrollment)
    dto.id = domain.id
    dto.enrollmentId = domain.enrollmentId
    dto.assessmentItemId = domain.assessmentItemId
    dto.score = domain.score
    dto.note = domain.note
    dto.correctedById = domain.correctedById
    dto.correctedAt =
      domain.correctedAt == null
        ? domain.correctedAt
        : domain.correctedAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class StudentScoreListResponseDto {
  @ApiProperty({ type: () => [StudentScoreResponseDto] })
  data!: StudentScoreResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: StudentScoreWithDetails[]
    total: number
    page: number
    limit: number
  }): StudentScoreListResponseDto {
    const dto = new StudentScoreListResponseDto()
    dto.data = domain.data.map((item) =>
      StudentScoreResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class StudentScoreRosterResponseAssessmentItemDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({
    enum: ['DAILY', 'MIDTERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL'],
  })
  type!: 'DAILY' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT' | 'PRACTICAL'

  @ApiProperty({ type: Number })
  weight!: number

  @ApiProperty({ type: Number })
  maxScore!: number

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetStudentScoreRosterUseCase['execute']>
      >['assessmentItem']
    >,
  ): StudentScoreRosterResponseAssessmentItemDto {
    const dto = new StudentScoreRosterResponseAssessmentItemDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.type = domain.type
    dto.weight = domain.weight
    dto.maxScore = domain.maxScore
    return dto
  }
}

export class StudentScoreRosterResponseItemsDto {
  @ApiProperty({ type: String })
  enrollmentId!: string

  @ApiProperty({ type: String })
  studentName!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiProperty({ type: String, nullable: true })
  scoreId!: string | null

  @ApiProperty({ type: Number, nullable: true })
  score!: number | null

  @ApiProperty({ type: String, nullable: true })
  note!: string | null

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetStudentScoreRosterUseCase['execute']>
      >['items'][number]
    >,
  ): StudentScoreRosterResponseItemsDto {
    const dto = new StudentScoreRosterResponseItemsDto()
    dto.enrollmentId = domain.enrollmentId
    dto.studentName = domain.studentName
    dto.nis = domain.nis
    dto.scoreId = domain.scoreId
    dto.score = domain.score
    dto.note = domain.note
    return dto
  }
}

export class StudentScoreRosterResponseDto {
  @ApiProperty({ type: () => StudentScoreRosterResponseAssessmentItemDto })
  assessmentItem!: StudentScoreRosterResponseAssessmentItemDto

  @ApiProperty({
    type: () => StudentScoreRosterResponseItemsDto,
    isArray: true,
  })
  items!: StudentScoreRosterResponseItemsDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetStudentScoreRosterUseCase['execute']>>,
  ): StudentScoreRosterResponseDto {
    const dto = new StudentScoreRosterResponseDto()
    dto.assessmentItem = StudentScoreRosterResponseAssessmentItemDto.fromDomain(
      domain.assessmentItem,
    )
    dto.items = domain.items.map((x) =>
      StudentScoreRosterResponseItemsDto.fromDomain(x),
    )
    return dto
  }
}

export class StudentScoreBulkResultResponseDto {
  @ApiProperty({ type: Number })
  saved!: number

  static fromDomain(
    domain: BulkUpsertResult,
  ): StudentScoreBulkResultResponseDto {
    const dto = new StudentScoreBulkResultResponseDto()
    dto.saved = domain.saved
    return dto
  }
}
