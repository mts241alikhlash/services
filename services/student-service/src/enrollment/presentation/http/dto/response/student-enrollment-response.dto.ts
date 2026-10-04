import type { BulkTransferStudentUseCase } from '../../../../application/use-cases/bulk-transfer-student/bulk-transfer-student.use-case.js'
import type { BulkCreateStudentEnrollmentUseCase } from '../../../../application/use-cases/bulk-create-student-enrollment/bulk-create-student-enrollment.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { EnrollmentWithDetails } from '../../../../domain/entities/enrollment.entity.js'

export class StudentEnrollmentResponseStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<EnrollmentWithDetails['student']>['user']
      >['profile']
    >,
  ): StudentEnrollmentResponseStudentUserProfileDto {
    const dto = new StudentEnrollmentResponseStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentResponseStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentEnrollmentResponseStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentEnrollmentResponseStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<EnrollmentWithDetails['student']>['user']>,
  ): StudentEnrollmentResponseStudentUserDto {
    const dto = new StudentEnrollmentResponseStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentEnrollmentResponseStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentEnrollmentResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: () => StudentEnrollmentResponseStudentUserDto })
  user?: StudentEnrollmentResponseStudentUserDto

  static fromDomain(
    domain: NonNullable<EnrollmentWithDetails['student']>,
  ): StudentEnrollmentResponseStudentDto {
    const dto = new StudentEnrollmentResponseStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentEnrollmentResponseStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class StudentEnrollmentResponseClassroomGradeDto {
  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<EnrollmentWithDetails['classroom']>['grade']
    >,
  ): StudentEnrollmentResponseClassroomGradeDto {
    const dto = new StudentEnrollmentResponseClassroomGradeDto()
    dto.level = domain.level
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentResponseClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: String })
  displayName!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiProperty({
    type: () => StudentEnrollmentResponseClassroomGradeDto,
    nullable: true,
  })
  grade!: StudentEnrollmentResponseClassroomGradeDto | null

  static fromDomain(
    domain: NonNullable<EnrollmentWithDetails['classroom']>,
  ): StudentEnrollmentResponseClassroomDto {
    const dto = new StudentEnrollmentResponseClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.displayName = domain.displayName
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    dto.grade =
      domain.grade == null
        ? domain.grade
        : StudentEnrollmentResponseClassroomGradeDto.fromDomain(domain.grade)
    return dto
  }
}

export class StudentEnrollmentResponseSemesterTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<NonNullable<EnrollmentWithDetails['semester']>['type']>,
  ): StudentEnrollmentResponseSemesterTypeDto {
    const dto = new StudentEnrollmentResponseSemesterTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<EnrollmentWithDetails['semester']>['academicYear']
    >,
  ): StudentEnrollmentResponseSemesterAcademicYearDto {
    const dto = new StudentEnrollmentResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentResponseSemesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({
    type: () => StudentEnrollmentResponseSemesterTypeDto,
    nullable: true,
  })
  type!: StudentEnrollmentResponseSemesterTypeDto | null

  @ApiProperty({
    type: () => StudentEnrollmentResponseSemesterAcademicYearDto,
    nullable: true,
  })
  academicYear!: StudentEnrollmentResponseSemesterAcademicYearDto | null

  static fromDomain(
    domain: NonNullable<EnrollmentWithDetails['semester']>,
  ): StudentEnrollmentResponseSemesterDto {
    const dto = new StudentEnrollmentResponseSemesterDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.isActive = domain.isActive
    dto.type =
      domain.type == null
        ? domain.type
        : StudentEnrollmentResponseSemesterTypeDto.fromDomain(domain.type)
    dto.academicYear =
      domain.academicYear == null
        ? domain.academicYear
        : StudentEnrollmentResponseSemesterAcademicYearDto.fromDomain(
            domain.academicYear,
          )
    return dto
  }
}

export class StudentEnrollmentResponseDto {
  @ApiPropertyOptional({ type: () => StudentEnrollmentResponseStudentDto })
  student?: StudentEnrollmentResponseStudentDto

  @ApiPropertyOptional({ type: () => StudentEnrollmentResponseClassroomDto })
  classroom?: StudentEnrollmentResponseClassroomDto

  @ApiPropertyOptional({ type: () => StudentEnrollmentResponseSemesterDto })
  semester?: StudentEnrollmentResponseSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  enrolledAt!: string

  @ApiPropertyOptional({ type: String })
  status?: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  static fromDomain(
    domain: EnrollmentWithDetails,
  ): StudentEnrollmentResponseDto {
    const dto = new StudentEnrollmentResponseDto()
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentEnrollmentResponseStudentDto.fromDomain(domain.student)
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : StudentEnrollmentResponseClassroomDto.fromDomain(domain.classroom)
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : StudentEnrollmentResponseSemesterDto.fromDomain(domain.semester)
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.enrolledAt = domain.enrolledAt.toISOString()
    dto.status = domain.status
    if (domain.endedAt !== undefined)
      dto.endedAt =
        domain.endedAt == null ? domain.endedAt : domain.endedAt.toISOString()
    dto.note = domain.note
    return dto
  }
}

export class StudentEnrollmentListItemResponseStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<EnrollmentWithDetails['student']>['user']
      >['profile']
    >,
  ): StudentEnrollmentListItemResponseStudentUserProfileDto {
    const dto = new StudentEnrollmentListItemResponseStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentListItemResponseStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentEnrollmentListItemResponseStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentEnrollmentListItemResponseStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<EnrollmentWithDetails['student']>['user']>,
  ): StudentEnrollmentListItemResponseStudentUserDto {
    const dto = new StudentEnrollmentListItemResponseStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentEnrollmentListItemResponseStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentEnrollmentListItemResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => StudentEnrollmentListItemResponseStudentUserDto,
  })
  user?: StudentEnrollmentListItemResponseStudentUserDto

  static fromDomain(
    domain: NonNullable<EnrollmentWithDetails['student']>,
  ): StudentEnrollmentListItemResponseStudentDto {
    const dto = new StudentEnrollmentListItemResponseStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentEnrollmentListItemResponseStudentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class StudentEnrollmentListItemResponseClassroomGradeDto {
  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<EnrollmentWithDetails['classroom']>['grade']
    >,
  ): StudentEnrollmentListItemResponseClassroomGradeDto {
    const dto = new StudentEnrollmentListItemResponseClassroomGradeDto()
    dto.level = domain.level
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentListItemResponseClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: String })
  displayName!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiProperty({
    type: () => StudentEnrollmentListItemResponseClassroomGradeDto,
    nullable: true,
  })
  grade!: StudentEnrollmentListItemResponseClassroomGradeDto | null

  static fromDomain(
    domain: NonNullable<EnrollmentWithDetails['classroom']>,
  ): StudentEnrollmentListItemResponseClassroomDto {
    const dto = new StudentEnrollmentListItemResponseClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.displayName = domain.displayName
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    dto.grade =
      domain.grade == null
        ? domain.grade
        : StudentEnrollmentListItemResponseClassroomGradeDto.fromDomain(
            domain.grade,
          )
    return dto
  }
}

export class StudentEnrollmentListItemResponseSemesterTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<NonNullable<EnrollmentWithDetails['semester']>['type']>,
  ): StudentEnrollmentListItemResponseSemesterTypeDto {
    const dto = new StudentEnrollmentListItemResponseSemesterTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentListItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<EnrollmentWithDetails['semester']>['academicYear']
    >,
  ): StudentEnrollmentListItemResponseSemesterAcademicYearDto {
    const dto = new StudentEnrollmentListItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentEnrollmentListItemResponseSemesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({
    type: () => StudentEnrollmentListItemResponseSemesterTypeDto,
    nullable: true,
  })
  type!: StudentEnrollmentListItemResponseSemesterTypeDto | null

  @ApiProperty({
    type: () => StudentEnrollmentListItemResponseSemesterAcademicYearDto,
    nullable: true,
  })
  academicYear!: StudentEnrollmentListItemResponseSemesterAcademicYearDto | null

  static fromDomain(
    domain: NonNullable<EnrollmentWithDetails['semester']>,
  ): StudentEnrollmentListItemResponseSemesterDto {
    const dto = new StudentEnrollmentListItemResponseSemesterDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.isActive = domain.isActive
    dto.type =
      domain.type == null
        ? domain.type
        : StudentEnrollmentListItemResponseSemesterTypeDto.fromDomain(
            domain.type,
          )
    dto.academicYear =
      domain.academicYear == null
        ? domain.academicYear
        : StudentEnrollmentListItemResponseSemesterAcademicYearDto.fromDomain(
            domain.academicYear,
          )
    return dto
  }
}

export class StudentEnrollmentListItemResponseDto {
  @ApiPropertyOptional({
    type: () => StudentEnrollmentListItemResponseStudentDto,
  })
  student?: StudentEnrollmentListItemResponseStudentDto

  @ApiPropertyOptional({
    type: () => StudentEnrollmentListItemResponseClassroomDto,
  })
  classroom?: StudentEnrollmentListItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => StudentEnrollmentListItemResponseSemesterDto,
  })
  semester?: StudentEnrollmentListItemResponseSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  enrolledAt!: string

  @ApiPropertyOptional({ type: String })
  status?: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  static fromDomain(
    domain: EnrollmentWithDetails,
  ): StudentEnrollmentListItemResponseDto {
    const dto = new StudentEnrollmentListItemResponseDto()
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentEnrollmentListItemResponseStudentDto.fromDomain(
              domain.student,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : StudentEnrollmentListItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : StudentEnrollmentListItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.enrolledAt = domain.enrolledAt.toISOString()
    dto.status = domain.status
    if (domain.endedAt !== undefined)
      dto.endedAt =
        domain.endedAt == null ? domain.endedAt : domain.endedAt.toISOString()
    dto.note = domain.note
    return dto
  }
}

export class StudentEnrollmentListResponseDto {
  @ApiProperty({ type: () => [StudentEnrollmentListItemResponseDto] })
  data!: StudentEnrollmentListItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: EnrollmentWithDetails[]
    total: number
    page: number
    limit: number
  }): StudentEnrollmentListResponseDto {
    const dto = new StudentEnrollmentListResponseDto()
    dto.data = domain.data.map((item) =>
      StudentEnrollmentListItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class EnrollmentBulkCreateResponseDto {
  @ApiProperty({ type: Number })
  created!: number

  @ApiProperty({ type: Number })
  skipped!: number

  @ApiProperty({ type: String, isArray: true })
  errors!: string[]

  static fromDomain(
    domain: Awaited<ReturnType<BulkCreateStudentEnrollmentUseCase['execute']>>,
  ): EnrollmentBulkCreateResponseDto {
    const dto = new EnrollmentBulkCreateResponseDto()
    dto.created = domain.created
    dto.skipped = domain.skipped
    dto.errors = [...domain.errors]
    return dto
  }
}

export class EnrollmentBulkTransferResponseResultsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  success!: boolean

  @ApiPropertyOptional({ type: String })
  error?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<BulkTransferStudentUseCase['execute']>>['results']
      >[number]
    >,
  ): EnrollmentBulkTransferResponseResultsDto {
    const dto = new EnrollmentBulkTransferResponseResultsDto()
    dto.id = domain.id
    dto.success = domain.success
    dto.error = domain.error
    return dto
  }
}

export class EnrollmentBulkTransferResponseDto {
  @ApiProperty({
    type: () => EnrollmentBulkTransferResponseResultsDto,
    isArray: true,
  })
  results!: EnrollmentBulkTransferResponseResultsDto[]

  @ApiProperty({ type: Number })
  successCount!: number

  @ApiProperty({ type: Number })
  failCount!: number

  static fromDomain(
    domain: Awaited<ReturnType<BulkTransferStudentUseCase['execute']>>,
  ): EnrollmentBulkTransferResponseDto {
    const dto = new EnrollmentBulkTransferResponseDto()
    dto.results = domain.results.map((x) =>
      EnrollmentBulkTransferResponseResultsDto.fromDomain(x),
    )
    dto.successCount = domain.successCount
    dto.failCount = domain.failCount
    return dto
  }
}
