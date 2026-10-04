import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { StudentGraduationWithDetails } from '../../../../domain/entities/graduation.entity.js'

export class StudentGraduationResponseStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentGraduationWithDetails['student']>['user']
      >['profile']
    >,
  ): StudentGraduationResponseStudentUserProfileDto {
    const dto = new StudentGraduationResponseStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentGraduationResponseStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentGraduationResponseStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentGraduationResponseStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentGraduationWithDetails['student']>['user']
    >,
  ): StudentGraduationResponseStudentUserDto {
    const dto = new StudentGraduationResponseStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentGraduationResponseStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentGraduationResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: () => StudentGraduationResponseStudentUserDto })
  user?: StudentGraduationResponseStudentUserDto

  static fromDomain(
    domain: NonNullable<StudentGraduationWithDetails['student']>,
  ): StudentGraduationResponseStudentDto {
    const dto = new StudentGraduationResponseStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentGraduationResponseStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class StudentGraduationResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<StudentGraduationWithDetails['academicYear']>,
  ): StudentGraduationResponseAcademicYearDto {
    const dto = new StudentGraduationResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentGraduationResponseDto {
  @ApiPropertyOptional({ type: () => StudentGraduationResponseStudentDto })
  student?: StudentGraduationResponseStudentDto

  @ApiPropertyOptional({
    type: () => StudentGraduationResponseAcademicYearDto,
    nullable: true,
  })
  academicYear?: StudentGraduationResponseAcademicYearDto | null

  @ApiPropertyOptional({ type: String, nullable: true })
  certificateNo?: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  graduationDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  certificateNumber?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: StudentGraduationWithDetails,
  ): StudentGraduationResponseDto {
    const dto = new StudentGraduationResponseDto()
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentGraduationResponseStudentDto.fromDomain(domain.student)
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : StudentGraduationResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    dto.certificateNo = domain.certificateNo
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.academicYearId = domain.academicYearId
    if (domain.graduationDate !== undefined)
      dto.graduationDate =
        domain.graduationDate == null
          ? domain.graduationDate
          : domain.graduationDate.toISOString()
    dto.certificateNumber = domain.certificateNumber
    dto.notes = domain.notes
    dto.note = domain.note
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

export class StudentGraduationListItemResponseStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentGraduationWithDetails['student']>['user']
      >['profile']
    >,
  ): StudentGraduationListItemResponseStudentUserProfileDto {
    const dto = new StudentGraduationListItemResponseStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentGraduationListItemResponseStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentGraduationListItemResponseStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentGraduationListItemResponseStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentGraduationWithDetails['student']>['user']
    >,
  ): StudentGraduationListItemResponseStudentUserDto {
    const dto = new StudentGraduationListItemResponseStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentGraduationListItemResponseStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentGraduationListItemResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => StudentGraduationListItemResponseStudentUserDto,
  })
  user?: StudentGraduationListItemResponseStudentUserDto

  static fromDomain(
    domain: NonNullable<StudentGraduationWithDetails['student']>,
  ): StudentGraduationListItemResponseStudentDto {
    const dto = new StudentGraduationListItemResponseStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentGraduationListItemResponseStudentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class StudentGraduationListItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<StudentGraduationWithDetails['academicYear']>,
  ): StudentGraduationListItemResponseAcademicYearDto {
    const dto = new StudentGraduationListItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentGraduationListItemResponseDto {
  @ApiPropertyOptional({
    type: () => StudentGraduationListItemResponseStudentDto,
  })
  student?: StudentGraduationListItemResponseStudentDto

  @ApiPropertyOptional({
    type: () => StudentGraduationListItemResponseAcademicYearDto,
    nullable: true,
  })
  academicYear?: StudentGraduationListItemResponseAcademicYearDto | null

  @ApiPropertyOptional({ type: String, nullable: true })
  certificateNo?: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  graduationDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  certificateNumber?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: StudentGraduationWithDetails,
  ): StudentGraduationListItemResponseDto {
    const dto = new StudentGraduationListItemResponseDto()
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentGraduationListItemResponseStudentDto.fromDomain(
              domain.student,
            )
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : StudentGraduationListItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    dto.certificateNo = domain.certificateNo
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.academicYearId = domain.academicYearId
    if (domain.graduationDate !== undefined)
      dto.graduationDate =
        domain.graduationDate == null
          ? domain.graduationDate
          : domain.graduationDate.toISOString()
    dto.certificateNumber = domain.certificateNumber
    dto.notes = domain.notes
    dto.note = domain.note
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

export class StudentGraduationListResponseDto {
  @ApiProperty({ type: () => [StudentGraduationListItemResponseDto] })
  data!: StudentGraduationListItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: StudentGraduationWithDetails[]
    total: number
    page: number
    limit: number
  }): StudentGraduationListResponseDto {
    const dto = new StudentGraduationListResponseDto()
    dto.data = domain.data.map((item) =>
      StudentGraduationListItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
