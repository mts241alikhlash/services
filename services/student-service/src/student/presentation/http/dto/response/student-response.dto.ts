import type { CreateStudentResult } from '../../../../application/use-cases/create-student/create-student.use-case.js'
import type { UserEntity } from '../../../../../shared/domain/entities/user.entity.js'
import type { GetStudentsUseCase } from '../../../../application/use-cases/get-students/get-students.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { StudentWithDetails } from '../../../../domain/entities/student.entity.js'

export class StudentResponseUserProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  gender?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<StudentWithDetails['user']>['profile']>,
  ): StudentResponseUserProfileDto {
    const dto = new StudentResponseUserProfileDto()
    dto.name = domain.name
    dto.nik = domain.nik
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate instanceof Date
            ? domain.birthDate.toISOString()
            : domain.birthDate
    dto.email = domain.email
    dto.phone = domain.phone
    return dto
  }
}

export class StudentResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentResponseUserProfileDto,
    nullable: true,
  })
  profile?: StudentResponseUserProfileDto | null

  static fromDomain(
    domain: NonNullable<StudentWithDetails['user']>,
  ): StudentResponseUserDto {
    const dto = new StudentResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentResponseUserProfileDto.fromDomain(domain.profile)
    return dto
  }
}

export class StudentResponseGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Number })
  level!: number

  static fromDomain(
    domain: NonNullable<StudentWithDetails['grade']>,
  ): StudentResponseGradeDto {
    const dto = new StudentResponseGradeDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.level = domain.level
    return dto
  }
}

export class StudentResponseEnrollmentsClassroomDto {
  @ApiProperty({ type: String })
  code!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentWithDetails['enrollments']>[number]
      >['classroom']
    >,
  ): StudentResponseEnrollmentsClassroomDto {
    const dto = new StudentResponseEnrollmentsClassroomDto()
    dto.code = domain.code
    return dto
  }
}

export class StudentResponseEnrollmentsDto {
  @ApiProperty({ type: () => StudentResponseEnrollmentsClassroomDto })
  classroom!: StudentResponseEnrollmentsClassroomDto

  static fromDomain(
    domain: NonNullable<NonNullable<StudentWithDetails['enrollments']>[number]>,
  ): StudentResponseEnrollmentsDto {
    const dto = new StudentResponseEnrollmentsDto()
    dto.classroom = StudentResponseEnrollmentsClassroomDto.fromDomain(
      domain.classroom,
    )
    return dto
  }
}

export class StudentResponseParentsDto {
  @ApiProperty({ type: String })
  parentId!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({ type: String })
  relation!: string

  static fromDomain(
    domain: NonNullable<NonNullable<StudentWithDetails['parents']>[number]>,
  ): StudentResponseParentsDto {
    const dto = new StudentResponseParentsDto()
    dto.parentId = domain.parentId
    dto.isPrimary = domain.isPrimary
    dto.relation = domain.relation
    return dto
  }
}

export class StudentResponseDto {
  @ApiProperty({ type: () => StudentResponseUserDto })
  user!: StudentResponseUserDto

  @ApiPropertyOptional({ type: () => StudentResponseGradeDto, nullable: true })
  grade?: StudentResponseGradeDto | null

  @ApiPropertyOptional({
    type: () => StudentResponseEnrollmentsDto,
    isArray: true,
  })
  enrollments?: StudentResponseEnrollmentsDto[]

  @ApiPropertyOptional({ type: () => StudentResponseParentsDto, isArray: true })
  parents?: StudentResponseParentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiProperty({ type: String })
  nisn!: string

  @ApiProperty({ enum: ['ACTIVE', 'TRANSFERRED', 'DROPPED', 'GRADUATED'] })
  status!: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED' | 'GRADUATED'

  @ApiPropertyOptional({ type: String, nullable: true })
  gradeId?: string | null

  static fromDomain(domain: StudentWithDetails): StudentResponseDto {
    const dto = new StudentResponseDto()
    dto.user = StudentResponseUserDto.fromDomain(domain.user)
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : StudentResponseGradeDto.fromDomain(domain.grade)
    if (domain.enrollments !== undefined)
      dto.enrollments =
        domain.enrollments == null
          ? domain.enrollments
          : domain.enrollments.map((x) =>
              StudentResponseEnrollmentsDto.fromDomain(x),
            )
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) => StudentResponseParentsDto.fromDomain(x))
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    dto.nisn = domain.nisn
    dto.status = domain.status
    dto.gradeId = domain.gradeId
    return dto
  }
}

export class StudentListItemResponseUserProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  name?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  gender?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  birthPlace?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  birthDate?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<StudentWithDetails['user']>['profile']>,
  ): StudentListItemResponseUserProfileDto {
    const dto = new StudentListItemResponseUserProfileDto()
    dto.name = domain.name
    dto.nik = domain.nik
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate instanceof Date
            ? domain.birthDate.toISOString()
            : domain.birthDate
    dto.email = domain.email
    dto.phone = domain.phone
    return dto
  }
}

export class StudentListItemResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentListItemResponseUserProfileDto,
    nullable: true,
  })
  profile?: StudentListItemResponseUserProfileDto | null

  static fromDomain(
    domain: NonNullable<StudentWithDetails['user']>,
  ): StudentListItemResponseUserDto {
    const dto = new StudentListItemResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentListItemResponseUserProfileDto.fromDomain(domain.profile)
    return dto
  }
}

export class StudentListItemResponseGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Number })
  level!: number

  static fromDomain(
    domain: NonNullable<StudentWithDetails['grade']>,
  ): StudentListItemResponseGradeDto {
    const dto = new StudentListItemResponseGradeDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.level = domain.level
    return dto
  }
}

export class StudentListItemResponseEnrollmentsClassroomDto {
  @ApiProperty({ type: String })
  code!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentWithDetails['enrollments']>[number]
      >['classroom']
    >,
  ): StudentListItemResponseEnrollmentsClassroomDto {
    const dto = new StudentListItemResponseEnrollmentsClassroomDto()
    dto.code = domain.code
    return dto
  }
}

export class StudentListItemResponseEnrollmentsDto {
  @ApiProperty({ type: () => StudentListItemResponseEnrollmentsClassroomDto })
  classroom!: StudentListItemResponseEnrollmentsClassroomDto

  static fromDomain(
    domain: NonNullable<NonNullable<StudentWithDetails['enrollments']>[number]>,
  ): StudentListItemResponseEnrollmentsDto {
    const dto = new StudentListItemResponseEnrollmentsDto()
    dto.classroom = StudentListItemResponseEnrollmentsClassroomDto.fromDomain(
      domain.classroom,
    )
    return dto
  }
}

export class StudentListItemResponseParentsDto {
  @ApiProperty({ type: String })
  parentId!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({ type: String })
  relation!: string

  static fromDomain(
    domain: NonNullable<NonNullable<StudentWithDetails['parents']>[number]>,
  ): StudentListItemResponseParentsDto {
    const dto = new StudentListItemResponseParentsDto()
    dto.parentId = domain.parentId
    dto.isPrimary = domain.isPrimary
    dto.relation = domain.relation
    return dto
  }
}

export class StudentListItemResponseDto {
  @ApiProperty({ type: () => StudentListItemResponseUserDto })
  user!: StudentListItemResponseUserDto

  @ApiPropertyOptional({
    type: () => StudentListItemResponseGradeDto,
    nullable: true,
  })
  grade?: StudentListItemResponseGradeDto | null

  @ApiPropertyOptional({
    type: () => StudentListItemResponseEnrollmentsDto,
    isArray: true,
  })
  enrollments?: StudentListItemResponseEnrollmentsDto[]

  @ApiPropertyOptional({
    type: () => StudentListItemResponseParentsDto,
    isArray: true,
  })
  parents?: StudentListItemResponseParentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiProperty({ type: String })
  nisn!: string

  @ApiProperty({ enum: ['ACTIVE', 'TRANSFERRED', 'DROPPED', 'GRADUATED'] })
  status!: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED' | 'GRADUATED'

  @ApiPropertyOptional({ type: String, nullable: true })
  gradeId?: string | null

  static fromDomain(domain: StudentWithDetails): StudentListItemResponseDto {
    const dto = new StudentListItemResponseDto()
    dto.user = StudentListItemResponseUserDto.fromDomain(domain.user)
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : StudentListItemResponseGradeDto.fromDomain(domain.grade)
    if (domain.enrollments !== undefined)
      dto.enrollments =
        domain.enrollments == null
          ? domain.enrollments
          : domain.enrollments.map((x) =>
              StudentListItemResponseEnrollmentsDto.fromDomain(x),
            )
    if (domain.parents !== undefined)
      dto.parents =
        domain.parents == null
          ? domain.parents
          : domain.parents.map((x) =>
              StudentListItemResponseParentsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    dto.nisn = domain.nisn
    dto.status = domain.status
    dto.gradeId = domain.gradeId
    return dto
  }
}

export class StudentListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetStudentsUseCase['execute']>>['meta'],
  ): StudentListResponseMetaDto {
    const dto = new StudentListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class StudentListResponseDto {
  @ApiProperty({ type: () => [StudentListItemResponseDto] })
  data!: StudentListItemResponseDto[]

  @ApiProperty({ type: () => StudentListResponseMetaDto })
  meta!: StudentListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetStudentsUseCase['execute']>>,
  ): StudentListResponseDto {
    const dto = new StudentListResponseDto()
    dto.data = domain.data.map((item) =>
      StudentListItemResponseDto.fromDomain(item),
    )
    dto.meta = StudentListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class StudentAccountStatusResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiPropertyOptional({ type: String })
  passwordHash?: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastLoginAt?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: UserEntity): StudentAccountStatusResponseDto {
    const dto = new StudentAccountStatusResponseDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.passwordHash = domain.passwordHash
    dto.isActive = domain.isActive
    if (domain.lastLoginAt !== undefined)
      dto.lastLoginAt =
        domain.lastLoginAt == null
          ? domain.lastLoginAt
          : domain.lastLoginAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class StudentCreatedResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiProperty({ type: String })
  nisn!: string

  @ApiProperty({ enum: ['ACTIVE', 'TRANSFERRED', 'DROPPED', 'GRADUATED'] })
  status!: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED' | 'GRADUATED'

  @ApiPropertyOptional({ type: String })
  gradeId?: string

  static fromDomain(domain: CreateStudentResult): StudentCreatedResponseDto {
    const dto = new StudentCreatedResponseDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    dto.nisn = domain.nisn
    dto.status = domain.status
    dto.gradeId = domain.gradeId
    return dto
  }
}
