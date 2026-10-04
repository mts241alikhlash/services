import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AssessmentItemWithDetails } from '../../../../domain/entities/assessment-item.entity.js'

export class AssessmentItemResponseTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<AssessmentItemWithDetails['teachingAssignment']>['subject']
    >,
  ): AssessmentItemResponseTeachingAssignmentSubjectDto {
    const dto = new AssessmentItemResponseTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class AssessmentItemResponseTeachingAssignmentClassroomDto {
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
      NonNullable<AssessmentItemWithDetails['teachingAssignment']>['classroom']
    >,
  ): AssessmentItemResponseTeachingAssignmentClassroomDto {
    const dto = new AssessmentItemResponseTeachingAssignmentClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    return dto
  }
}

export class AssessmentItemResponseTeachingAssignmentEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            AssessmentItemWithDetails['teachingAssignment']
          >['employee']
        >['user']
      >['profile']
    >,
  ): AssessmentItemResponseTeachingAssignmentEmployeeUserProfileDto {
    const dto =
      new AssessmentItemResponseTeachingAssignmentEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class AssessmentItemResponseTeachingAssignmentEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => AssessmentItemResponseTeachingAssignmentEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: AssessmentItemResponseTeachingAssignmentEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AssessmentItemWithDetails['teachingAssignment']>['employee']
      >['user']
    >,
  ): AssessmentItemResponseTeachingAssignmentEmployeeUserDto {
    const dto = new AssessmentItemResponseTeachingAssignmentEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : AssessmentItemResponseTeachingAssignmentEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class AssessmentItemResponseTeachingAssignmentEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => AssessmentItemResponseTeachingAssignmentEmployeeUserDto,
  })
  user?: AssessmentItemResponseTeachingAssignmentEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<AssessmentItemWithDetails['teachingAssignment']>['employee']
    >,
  ): AssessmentItemResponseTeachingAssignmentEmployeeDto {
    const dto = new AssessmentItemResponseTeachingAssignmentEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : AssessmentItemResponseTeachingAssignmentEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class AssessmentItemResponseTeachingAssignmentDto {
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
    type: () => AssessmentItemResponseTeachingAssignmentSubjectDto,
  })
  subject?: AssessmentItemResponseTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () => AssessmentItemResponseTeachingAssignmentClassroomDto,
  })
  classroom?: AssessmentItemResponseTeachingAssignmentClassroomDto

  @ApiPropertyOptional({
    type: () => AssessmentItemResponseTeachingAssignmentEmployeeDto,
  })
  employee?: AssessmentItemResponseTeachingAssignmentEmployeeDto

  static fromDomain(
    domain: NonNullable<AssessmentItemWithDetails['teachingAssignment']>,
  ): AssessmentItemResponseTeachingAssignmentDto {
    const dto = new AssessmentItemResponseTeachingAssignmentDto()
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
          : AssessmentItemResponseTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : AssessmentItemResponseTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : AssessmentItemResponseTeachingAssignmentEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class AssessmentItemResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  studentScores?: number

  static fromDomain(
    domain: NonNullable<AssessmentItemWithDetails['_count']>,
  ): AssessmentItemResponseCountDto {
    const dto = new AssessmentItemResponseCountDto()
    dto.studentScores = domain.studentScores
    return dto
  }
}

export class AssessmentItemResponseDto {
  @ApiPropertyOptional({
    type: () => AssessmentItemResponseTeachingAssignmentDto,
  })
  teachingAssignment?: AssessmentItemResponseTeachingAssignmentDto

  @ApiPropertyOptional({ type: () => AssessmentItemResponseCountDto })
  _count?: AssessmentItemResponseCountDto

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
    domain: AssessmentItemWithDetails,
  ): AssessmentItemResponseDto {
    const dto = new AssessmentItemResponseDto()
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : AssessmentItemResponseTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : AssessmentItemResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.name = domain.name
    dto.type = domain.type
    dto.weight = domain.weight
    dto.maxScore = domain.maxScore
    return dto
  }
}

export class AssessmentItemListResponseDto {
  @ApiProperty({ type: () => [AssessmentItemResponseDto] })
  data!: AssessmentItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: AssessmentItemWithDetails[]
    total: number
    page: number
    limit: number
  }): AssessmentItemListResponseDto {
    const dto = new AssessmentItemListResponseDto()
    dto.data = domain.data.map((item) =>
      AssessmentItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
