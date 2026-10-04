import type { GetStudentParentsListUseCase } from '../../../../application/use-cases/get-student-parents-list/get-student-parents-list.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { StudentParentWithDetails } from '../../../../domain/entities/student-parent.entity.js'

export class StudentParentResponseParentOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentParentWithDetails['parent']>['occupation']
    >,
  ): StudentParentResponseParentOccupationDto {
    const dto = new StudentParentResponseParentOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentParentResponseParentEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentParentWithDetails['parent']>['education']
    >,
  ): StudentParentResponseParentEducationDto {
    const dto = new StudentParentResponseParentEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentParentResponseParentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  nik!: string

  @ApiProperty({ type: String })
  birthPlace!: string

  @ApiProperty({ type: String, format: 'date-time' })
  birthDate!: string

  @ApiProperty({ type: String, nullable: true })
  email!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String })
  occupationId!: string

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiPropertyOptional({
    type: () => StudentParentResponseParentOccupationDto,
    nullable: true,
  })
  occupation?: StudentParentResponseParentOccupationDto | null

  @ApiPropertyOptional({
    type: () => StudentParentResponseParentEducationDto,
    nullable: true,
  })
  education?: StudentParentResponseParentEducationDto | null

  static fromDomain(
    domain: NonNullable<StudentParentWithDetails['parent']>,
  ): StudentParentResponseParentDto {
    const dto = new StudentParentResponseParentDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate = domain.birthDate.toISOString()
    dto.email = domain.email
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    if (domain.occupation !== undefined)
      dto.occupation =
        domain.occupation == null
          ? domain.occupation
          : StudentParentResponseParentOccupationDto.fromDomain(
              domain.occupation,
            )
    if (domain.education !== undefined)
      dto.education =
        domain.education == null
          ? domain.education
          : StudentParentResponseParentEducationDto.fromDomain(domain.education)
    return dto
  }
}

export class StudentParentResponseStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentParentWithDetails['student']>['user']
      >['profile']
    >,
  ): StudentParentResponseStudentUserProfileDto {
    const dto = new StudentParentResponseStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentParentResponseStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentParentResponseStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentParentResponseStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentParentWithDetails['student']>['user']
    >,
  ): StudentParentResponseStudentUserDto {
    const dto = new StudentParentResponseStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentParentResponseStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentParentResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: () => StudentParentResponseStudentUserDto })
  user?: StudentParentResponseStudentUserDto

  static fromDomain(
    domain: NonNullable<StudentParentWithDetails['student']>,
  ): StudentParentResponseStudentDto {
    const dto = new StudentParentResponseStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentParentResponseStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class StudentParentResponseDto {
  @ApiPropertyOptional({ type: () => StudentParentResponseParentDto })
  parent?: StudentParentResponseParentDto

  @ApiPropertyOptional({ type: () => StudentParentResponseStudentDto })
  student?: StudentParentResponseStudentDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  parentId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  static fromDomain(
    domain: StudentParentWithDetails,
  ): StudentParentResponseDto {
    const dto = new StudentParentResponseDto()
    if (domain.parent !== undefined)
      dto.parent =
        domain.parent == null
          ? domain.parent
          : StudentParentResponseParentDto.fromDomain(domain.parent)
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentParentResponseStudentDto.fromDomain(domain.student)
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.parentId = domain.parentId
    dto.relation = domain.relation
    dto.isPrimary = domain.isPrimary
    return dto
  }
}

export class StudentParentListItemResponseParentOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentParentWithDetails['parent']>['occupation']
    >,
  ): StudentParentListItemResponseParentOccupationDto {
    const dto = new StudentParentListItemResponseParentOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentParentListItemResponseParentEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentParentWithDetails['parent']>['education']
    >,
  ): StudentParentListItemResponseParentEducationDto {
    const dto = new StudentParentListItemResponseParentEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class StudentParentListItemResponseParentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  nik!: string

  @ApiProperty({ type: String })
  birthPlace!: string

  @ApiProperty({ type: String, format: 'date-time' })
  birthDate!: string

  @ApiProperty({ type: String, nullable: true })
  email!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({ type: String })
  occupationId!: string

  @ApiProperty({ type: String, nullable: true })
  educationId!: string | null

  @ApiPropertyOptional({
    type: () => StudentParentListItemResponseParentOccupationDto,
    nullable: true,
  })
  occupation?: StudentParentListItemResponseParentOccupationDto | null

  @ApiPropertyOptional({
    type: () => StudentParentListItemResponseParentEducationDto,
    nullable: true,
  })
  education?: StudentParentListItemResponseParentEducationDto | null

  static fromDomain(
    domain: NonNullable<StudentParentWithDetails['parent']>,
  ): StudentParentListItemResponseParentDto {
    const dto = new StudentParentListItemResponseParentDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.nik = domain.nik
    dto.birthPlace = domain.birthPlace
    dto.birthDate = domain.birthDate.toISOString()
    dto.email = domain.email
    dto.phone = domain.phone
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    if (domain.occupation !== undefined)
      dto.occupation =
        domain.occupation == null
          ? domain.occupation
          : StudentParentListItemResponseParentOccupationDto.fromDomain(
              domain.occupation,
            )
    if (domain.education !== undefined)
      dto.education =
        domain.education == null
          ? domain.education
          : StudentParentListItemResponseParentEducationDto.fromDomain(
              domain.education,
            )
    return dto
  }
}

export class StudentParentListItemResponseStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StudentParentWithDetails['student']>['user']
      >['profile']
    >,
  ): StudentParentListItemResponseStudentUserProfileDto {
    const dto = new StudentParentListItemResponseStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class StudentParentListItemResponseStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => StudentParentListItemResponseStudentUserProfileDto,
    nullable: true,
  })
  profile?: StudentParentListItemResponseStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<StudentParentWithDetails['student']>['user']
    >,
  ): StudentParentListItemResponseStudentUserDto {
    const dto = new StudentParentListItemResponseStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : StudentParentListItemResponseStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class StudentParentListItemResponseStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => StudentParentListItemResponseStudentUserDto,
  })
  user?: StudentParentListItemResponseStudentUserDto

  static fromDomain(
    domain: NonNullable<StudentParentWithDetails['student']>,
  ): StudentParentListItemResponseStudentDto {
    const dto = new StudentParentListItemResponseStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : StudentParentListItemResponseStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class StudentParentListItemResponseDto {
  @ApiPropertyOptional({ type: () => StudentParentListItemResponseParentDto })
  parent?: StudentParentListItemResponseParentDto

  @ApiPropertyOptional({ type: () => StudentParentListItemResponseStudentDto })
  student?: StudentParentListItemResponseStudentDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  parentId!: string

  @ApiProperty({ enum: ['FATHER', 'MOTHER', 'GUARDIAN'] })
  relation!: 'FATHER' | 'MOTHER' | 'GUARDIAN'

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  static fromDomain(
    domain: StudentParentWithDetails,
  ): StudentParentListItemResponseDto {
    const dto = new StudentParentListItemResponseDto()
    if (domain.parent !== undefined)
      dto.parent =
        domain.parent == null
          ? domain.parent
          : StudentParentListItemResponseParentDto.fromDomain(domain.parent)
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : StudentParentListItemResponseStudentDto.fromDomain(domain.student)
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.parentId = domain.parentId
    dto.relation = domain.relation
    dto.isPrimary = domain.isPrimary
    return dto
  }
}

export class StudentParentListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<
      ReturnType<GetStudentParentsListUseCase['execute']>
    >['meta'],
  ): StudentParentListResponseMetaDto {
    const dto = new StudentParentListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class StudentParentListResponseDto {
  @ApiProperty({ type: () => [StudentParentListItemResponseDto] })
  data!: StudentParentListItemResponseDto[]

  @ApiProperty({ type: () => StudentParentListResponseMetaDto })
  meta!: StudentParentListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetStudentParentsListUseCase['execute']>>,
  ): StudentParentListResponseDto {
    const dto = new StudentParentListResponseDto()
    dto.data = domain.data.map((item) =>
      StudentParentListItemResponseDto.fromDomain(item),
    )
    dto.meta = StudentParentListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
