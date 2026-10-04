import type { BulkAssignmentResult } from '../../../../domain/entities/bulk-assignment.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { TeachingAssignmentWithDetails } from '../../../../domain/entities/teaching-assignment.entity.js'

export class TeachingAssignmentItemResponseEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<TeachingAssignmentWithDetails['employee']>['user']
      >['profile']
    >,
  ): TeachingAssignmentItemResponseEmployeeUserProfileDto {
    const dto = new TeachingAssignmentItemResponseEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class TeachingAssignmentItemResponseEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: TeachingAssignmentItemResponseEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<TeachingAssignmentWithDetails['employee']>['user']
    >,
  ): TeachingAssignmentItemResponseEmployeeUserDto {
    const dto = new TeachingAssignmentItemResponseEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : TeachingAssignmentItemResponseEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class TeachingAssignmentItemResponseEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseEmployeeUserDto,
  })
  user?: TeachingAssignmentItemResponseEmployeeUserDto

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['employee']>,
  ): TeachingAssignmentItemResponseEmployeeDto {
    const dto = new TeachingAssignmentItemResponseEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : TeachingAssignmentItemResponseEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class TeachingAssignmentItemResponseSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['subject']>,
  ): TeachingAssignmentItemResponseSubjectDto {
    const dto = new TeachingAssignmentItemResponseSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class TeachingAssignmentItemResponseClassroomGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<TeachingAssignmentWithDetails['classroom']>['grade']
    >,
  ): TeachingAssignmentItemResponseClassroomGradeDto {
    const dto = new TeachingAssignmentItemResponseClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class TeachingAssignmentItemResponseClassroomDto {
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

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseClassroomGradeDto,
  })
  grade?: TeachingAssignmentItemResponseClassroomGradeDto

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['classroom']>,
  ): TeachingAssignmentItemResponseClassroomDto {
    const dto = new TeachingAssignmentItemResponseClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : TeachingAssignmentItemResponseClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class TeachingAssignmentItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<TeachingAssignmentWithDetails['semester']>['academicYear']
    >,
  ): TeachingAssignmentItemResponseSemesterAcademicYearDto {
    const dto = new TeachingAssignmentItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class TeachingAssignmentItemResponseSemesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startDate!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endDate!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseSemesterAcademicYearDto,
  })
  academicYear?: TeachingAssignmentItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['semester']>,
  ): TeachingAssignmentItemResponseSemesterDto {
    const dto = new TeachingAssignmentItemResponseSemesterDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.typeId = domain.typeId
    dto.startDate =
      domain.startDate == null
        ? domain.startDate
        : domain.startDate.toISOString()
    dto.endDate =
      domain.endDate == null ? domain.endDate : domain.endDate.toISOString()
    dto.isActive = domain.isActive
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : TeachingAssignmentItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class TeachingAssignmentItemResponseDto {
  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseEmployeeDto,
  })
  employee?: TeachingAssignmentItemResponseEmployeeDto

  @ApiPropertyOptional({ type: () => TeachingAssignmentItemResponseSubjectDto })
  subject?: TeachingAssignmentItemResponseSubjectDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseClassroomDto,
  })
  classroom?: TeachingAssignmentItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentItemResponseSemesterDto,
  })
  semester?: TeachingAssignmentItemResponseSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  passingScore?: number | null

  static fromDomain(
    domain: TeachingAssignmentWithDetails,
  ): TeachingAssignmentItemResponseDto {
    const dto = new TeachingAssignmentItemResponseDto()
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : TeachingAssignmentItemResponseEmployeeDto.fromDomain(
              domain.employee,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : TeachingAssignmentItemResponseSubjectDto.fromDomain(domain.subject)
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : TeachingAssignmentItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : TeachingAssignmentItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.subjectId = domain.subjectId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class TeachingAssignmentPageItemResponseEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<TeachingAssignmentWithDetails['employee']>['user']
      >['profile']
    >,
  ): TeachingAssignmentPageItemResponseEmployeeUserProfileDto {
    const dto = new TeachingAssignmentPageItemResponseEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class TeachingAssignmentPageItemResponseEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: TeachingAssignmentPageItemResponseEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<TeachingAssignmentWithDetails['employee']>['user']
    >,
  ): TeachingAssignmentPageItemResponseEmployeeUserDto {
    const dto = new TeachingAssignmentPageItemResponseEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : TeachingAssignmentPageItemResponseEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class TeachingAssignmentPageItemResponseEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseEmployeeUserDto,
  })
  user?: TeachingAssignmentPageItemResponseEmployeeUserDto

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['employee']>,
  ): TeachingAssignmentPageItemResponseEmployeeDto {
    const dto = new TeachingAssignmentPageItemResponseEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : TeachingAssignmentPageItemResponseEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class TeachingAssignmentPageItemResponseSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['subject']>,
  ): TeachingAssignmentPageItemResponseSubjectDto {
    const dto = new TeachingAssignmentPageItemResponseSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class TeachingAssignmentPageItemResponseClassroomGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<TeachingAssignmentWithDetails['classroom']>['grade']
    >,
  ): TeachingAssignmentPageItemResponseClassroomGradeDto {
    const dto = new TeachingAssignmentPageItemResponseClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class TeachingAssignmentPageItemResponseClassroomDto {
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

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseClassroomGradeDto,
  })
  grade?: TeachingAssignmentPageItemResponseClassroomGradeDto

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['classroom']>,
  ): TeachingAssignmentPageItemResponseClassroomDto {
    const dto = new TeachingAssignmentPageItemResponseClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : TeachingAssignmentPageItemResponseClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class TeachingAssignmentPageItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<TeachingAssignmentWithDetails['semester']>['academicYear']
    >,
  ): TeachingAssignmentPageItemResponseSemesterAcademicYearDto {
    const dto = new TeachingAssignmentPageItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class TeachingAssignmentPageItemResponseSemesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startDate!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endDate!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseSemesterAcademicYearDto,
  })
  academicYear?: TeachingAssignmentPageItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<TeachingAssignmentWithDetails['semester']>,
  ): TeachingAssignmentPageItemResponseSemesterDto {
    const dto = new TeachingAssignmentPageItemResponseSemesterDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.typeId = domain.typeId
    dto.startDate =
      domain.startDate == null
        ? domain.startDate
        : domain.startDate.toISOString()
    dto.endDate =
      domain.endDate == null ? domain.endDate : domain.endDate.toISOString()
    dto.isActive = domain.isActive
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : TeachingAssignmentPageItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class TeachingAssignmentPageItemResponseDto {
  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseEmployeeDto,
  })
  employee?: TeachingAssignmentPageItemResponseEmployeeDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseSubjectDto,
  })
  subject?: TeachingAssignmentPageItemResponseSubjectDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseClassroomDto,
  })
  classroom?: TeachingAssignmentPageItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentPageItemResponseSemesterDto,
  })
  semester?: TeachingAssignmentPageItemResponseSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  passingScore?: number | null

  static fromDomain(
    domain: TeachingAssignmentWithDetails,
  ): TeachingAssignmentPageItemResponseDto {
    const dto = new TeachingAssignmentPageItemResponseDto()
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : TeachingAssignmentPageItemResponseEmployeeDto.fromDomain(
              domain.employee,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : TeachingAssignmentPageItemResponseSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : TeachingAssignmentPageItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : TeachingAssignmentPageItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.subjectId = domain.subjectId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class TeachingAssignmentPageResponseDto {
  @ApiProperty({ type: () => [TeachingAssignmentPageItemResponseDto] })
  data!: TeachingAssignmentPageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: TeachingAssignmentWithDetails[]
    total: number
    page: number
    limit: number
  }): TeachingAssignmentPageResponseDto {
    const dto = new TeachingAssignmentPageResponseDto()
    dto.data = domain.data.map((item) =>
      TeachingAssignmentPageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<BulkAssignmentResult['created']>[number]
          >['employee']
        >['user']
      >['profile']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedEmployeeUserProfileDto {
    const dto =
      new TeachingAssignmentBulkResultResponseCreatedEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      TeachingAssignmentBulkResultResponseCreatedEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: TeachingAssignmentBulkResultResponseCreatedEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<BulkAssignmentResult['created']>[number]
        >['employee']
      >['user']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedEmployeeUserDto {
    const dto = new TeachingAssignmentBulkResultResponseCreatedEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : TeachingAssignmentBulkResultResponseCreatedEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => TeachingAssignmentBulkResultResponseCreatedEmployeeUserDto,
  })
  user?: TeachingAssignmentBulkResultResponseCreatedEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<BulkAssignmentResult['created']>[number]
      >['employee']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedEmployeeDto {
    const dto = new TeachingAssignmentBulkResultResponseCreatedEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : TeachingAssignmentBulkResultResponseCreatedEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<BulkAssignmentResult['created']>[number]
      >['subject']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedSubjectDto {
    const dto = new TeachingAssignmentBulkResultResponseCreatedSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedClassroomGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<BulkAssignmentResult['created']>[number]
        >['classroom']
      >['grade']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedClassroomGradeDto {
    const dto =
      new TeachingAssignmentBulkResultResponseCreatedClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedClassroomDto {
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

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({
    type: () => TeachingAssignmentBulkResultResponseCreatedClassroomGradeDto,
  })
  grade?: TeachingAssignmentBulkResultResponseCreatedClassroomGradeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<BulkAssignmentResult['created']>[number]
      >['classroom']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedClassroomDto {
    const dto = new TeachingAssignmentBulkResultResponseCreatedClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : TeachingAssignmentBulkResultResponseCreatedClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<BulkAssignmentResult['created']>[number]
        >['semester']
      >['academicYear']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedSemesterAcademicYearDto {
    const dto =
      new TeachingAssignmentBulkResultResponseCreatedSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedSemesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startDate!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endDate!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      TeachingAssignmentBulkResultResponseCreatedSemesterAcademicYearDto,
  })
  academicYear?: TeachingAssignmentBulkResultResponseCreatedSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<BulkAssignmentResult['created']>[number]
      >['semester']
    >,
  ): TeachingAssignmentBulkResultResponseCreatedSemesterDto {
    const dto = new TeachingAssignmentBulkResultResponseCreatedSemesterDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.typeId = domain.typeId
    dto.startDate =
      domain.startDate == null
        ? domain.startDate
        : domain.startDate.toISOString()
    dto.endDate =
      domain.endDate == null ? domain.endDate : domain.endDate.toISOString()
    dto.isActive = domain.isActive
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : TeachingAssignmentBulkResultResponseCreatedSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseCreatedDto {
  @ApiPropertyOptional({
    type: () => TeachingAssignmentBulkResultResponseCreatedEmployeeDto,
  })
  employee?: TeachingAssignmentBulkResultResponseCreatedEmployeeDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentBulkResultResponseCreatedSubjectDto,
  })
  subject?: TeachingAssignmentBulkResultResponseCreatedSubjectDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentBulkResultResponseCreatedClassroomDto,
  })
  classroom?: TeachingAssignmentBulkResultResponseCreatedClassroomDto

  @ApiPropertyOptional({
    type: () => TeachingAssignmentBulkResultResponseCreatedSemesterDto,
  })
  semester?: TeachingAssignmentBulkResultResponseCreatedSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  passingScore?: number | null

  static fromDomain(
    domain: NonNullable<NonNullable<BulkAssignmentResult['created']>[number]>,
  ): TeachingAssignmentBulkResultResponseCreatedDto {
    const dto = new TeachingAssignmentBulkResultResponseCreatedDto()
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : TeachingAssignmentBulkResultResponseCreatedEmployeeDto.fromDomain(
              domain.employee,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : TeachingAssignmentBulkResultResponseCreatedSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : TeachingAssignmentBulkResultResponseCreatedClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : TeachingAssignmentBulkResultResponseCreatedSemesterDto.fromDomain(
              domain.semester,
            )
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.subjectId = domain.subjectId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseSkippedDto {
  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ enum: ['ALREADY_ASSIGNED'] })
  reason!: 'ALREADY_ASSIGNED'

  static fromDomain(
    domain: NonNullable<NonNullable<BulkAssignmentResult['skipped']>[number]>,
  ): TeachingAssignmentBulkResultResponseSkippedDto {
    const dto = new TeachingAssignmentBulkResultResponseSkippedDto()
    dto.classroomId = domain.classroomId
    dto.reason = domain.reason
    return dto
  }
}

export class TeachingAssignmentBulkResultResponseDto {
  @ApiProperty({
    type: () => TeachingAssignmentBulkResultResponseCreatedDto,
    isArray: true,
  })
  created!: TeachingAssignmentBulkResultResponseCreatedDto[]

  @ApiProperty({
    type: () => TeachingAssignmentBulkResultResponseSkippedDto,
    isArray: true,
  })
  skipped!: TeachingAssignmentBulkResultResponseSkippedDto[]

  static fromDomain(
    domain: BulkAssignmentResult,
  ): TeachingAssignmentBulkResultResponseDto {
    const dto = new TeachingAssignmentBulkResultResponseDto()
    dto.created = domain.created.map((x) =>
      TeachingAssignmentBulkResultResponseCreatedDto.fromDomain(x),
    )
    dto.skipped = domain.skipped.map((x) =>
      TeachingAssignmentBulkResultResponseSkippedDto.fromDomain(x),
    )
    return dto
  }
}
