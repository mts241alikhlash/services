import type { SubjectEntity } from '../../../../domain/entities/subject.entity.js'
import type { GetSubjectsUseCase } from '../../../../application/use-cases/get-subjects/get-subjects.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { SubjectWithEmployees } from '../../../../domain/entities/subject.entity.js'

export class SubjectItemResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  teachingAssignments?: number

  static fromDomain(
    domain: NonNullable<SubjectWithEmployees['_count']>,
  ): SubjectItemResponseCountDto {
    const dto = new SubjectItemResponseCountDto()
    dto.teachingAssignments = domain.teachingAssignments
    return dto
  }
}

export class SubjectItemResponseTeachingAssignmentsClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
      >['classroom']
    >,
  ): SubjectItemResponseTeachingAssignmentsClassroomDto {
    const dto = new SubjectItemResponseTeachingAssignmentsClassroomDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class SubjectItemResponseTeachingAssignmentsEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
          >['employee']
        >['user']
      >['profile']
    >,
  ): SubjectItemResponseTeachingAssignmentsEmployeeUserProfileDto {
    const dto =
      new SubjectItemResponseTeachingAssignmentsEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class SubjectItemResponseTeachingAssignmentsEmployeeUserDto {
  @ApiProperty({
    type: () => SubjectItemResponseTeachingAssignmentsEmployeeUserProfileDto,
  })
  profile!: SubjectItemResponseTeachingAssignmentsEmployeeUserProfileDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
        >['employee']
      >['user']
    >,
  ): SubjectItemResponseTeachingAssignmentsEmployeeUserDto {
    const dto = new SubjectItemResponseTeachingAssignmentsEmployeeUserDto()
    dto.profile =
      SubjectItemResponseTeachingAssignmentsEmployeeUserProfileDto.fromDomain(
        domain.profile,
      )
    return dto
  }
}

export class SubjectItemResponseTeachingAssignmentsEmployeeDto {
  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiProperty({
    type: () => SubjectItemResponseTeachingAssignmentsEmployeeUserDto,
    nullable: true,
  })
  user!: SubjectItemResponseTeachingAssignmentsEmployeeUserDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
      >['employee']
    >,
  ): SubjectItemResponseTeachingAssignmentsEmployeeDto {
    const dto = new SubjectItemResponseTeachingAssignmentsEmployeeDto()
    dto.nip = domain.nip
    dto.user =
      domain.user == null
        ? domain.user
        : SubjectItemResponseTeachingAssignmentsEmployeeUserDto.fromDomain(
            domain.user,
          )
    return dto
  }
}

export class SubjectItemResponseTeachingAssignmentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({
    type: () => SubjectItemResponseTeachingAssignmentsClassroomDto,
  })
  classroom!: SubjectItemResponseTeachingAssignmentsClassroomDto

  @ApiProperty({
    type: () => SubjectItemResponseTeachingAssignmentsEmployeeDto,
  })
  employee!: SubjectItemResponseTeachingAssignmentsEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
    >,
  ): SubjectItemResponseTeachingAssignmentsDto {
    const dto = new SubjectItemResponseTeachingAssignmentsDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroom =
      SubjectItemResponseTeachingAssignmentsClassroomDto.fromDomain(
        domain.classroom,
      )
    dto.employee = SubjectItemResponseTeachingAssignmentsEmployeeDto.fromDomain(
      domain.employee,
    )
    return dto
  }
}

export class SubjectItemResponseDto {
  @ApiPropertyOptional({ type: () => SubjectItemResponseCountDto })
  _count?: SubjectItemResponseCountDto

  @ApiPropertyOptional({
    type: () => SubjectItemResponseTeachingAssignmentsDto,
    isArray: true,
  })
  teachingAssignments?: SubjectItemResponseTeachingAssignmentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  code?: string | null

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(domain: SubjectWithEmployees): SubjectItemResponseDto {
    const dto = new SubjectItemResponseDto()
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : SubjectItemResponseCountDto.fromDomain(domain._count)
    if (domain.teachingAssignments !== undefined)
      dto.teachingAssignments =
        domain.teachingAssignments == null
          ? domain.teachingAssignments
          : domain.teachingAssignments.map((x) =>
              SubjectItemResponseTeachingAssignmentsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.description = domain.description
    dto.isActive = domain.isActive
    return dto
  }
}

export class SubjectPageItemResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  teachingAssignments?: number

  static fromDomain(
    domain: NonNullable<SubjectWithEmployees['_count']>,
  ): SubjectPageItemResponseCountDto {
    const dto = new SubjectPageItemResponseCountDto()
    dto.teachingAssignments = domain.teachingAssignments
    return dto
  }
}

export class SubjectPageItemResponseTeachingAssignmentsClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
      >['classroom']
    >,
  ): SubjectPageItemResponseTeachingAssignmentsClassroomDto {
    const dto = new SubjectPageItemResponseTeachingAssignmentsClassroomDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class SubjectPageItemResponseTeachingAssignmentsEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
          >['employee']
        >['user']
      >['profile']
    >,
  ): SubjectPageItemResponseTeachingAssignmentsEmployeeUserProfileDto {
    const dto =
      new SubjectPageItemResponseTeachingAssignmentsEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class SubjectPageItemResponseTeachingAssignmentsEmployeeUserDto {
  @ApiProperty({
    type: () =>
      SubjectPageItemResponseTeachingAssignmentsEmployeeUserProfileDto,
  })
  profile!: SubjectPageItemResponseTeachingAssignmentsEmployeeUserProfileDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
        >['employee']
      >['user']
    >,
  ): SubjectPageItemResponseTeachingAssignmentsEmployeeUserDto {
    const dto = new SubjectPageItemResponseTeachingAssignmentsEmployeeUserDto()
    dto.profile =
      SubjectPageItemResponseTeachingAssignmentsEmployeeUserProfileDto.fromDomain(
        domain.profile,
      )
    return dto
  }
}

export class SubjectPageItemResponseTeachingAssignmentsEmployeeDto {
  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiProperty({
    type: () => SubjectPageItemResponseTeachingAssignmentsEmployeeUserDto,
    nullable: true,
  })
  user!: SubjectPageItemResponseTeachingAssignmentsEmployeeUserDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
      >['employee']
    >,
  ): SubjectPageItemResponseTeachingAssignmentsEmployeeDto {
    const dto = new SubjectPageItemResponseTeachingAssignmentsEmployeeDto()
    dto.nip = domain.nip
    dto.user =
      domain.user == null
        ? domain.user
        : SubjectPageItemResponseTeachingAssignmentsEmployeeUserDto.fromDomain(
            domain.user,
          )
    return dto
  }
}

export class SubjectPageItemResponseTeachingAssignmentsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({
    type: () => SubjectPageItemResponseTeachingAssignmentsClassroomDto,
  })
  classroom!: SubjectPageItemResponseTeachingAssignmentsClassroomDto

  @ApiProperty({
    type: () => SubjectPageItemResponseTeachingAssignmentsEmployeeDto,
  })
  employee!: SubjectPageItemResponseTeachingAssignmentsEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<SubjectWithEmployees['teachingAssignments']>[number]
    >,
  ): SubjectPageItemResponseTeachingAssignmentsDto {
    const dto = new SubjectPageItemResponseTeachingAssignmentsDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroom =
      SubjectPageItemResponseTeachingAssignmentsClassroomDto.fromDomain(
        domain.classroom,
      )
    dto.employee =
      SubjectPageItemResponseTeachingAssignmentsEmployeeDto.fromDomain(
        domain.employee,
      )
    return dto
  }
}

export class SubjectPageItemResponseDto {
  @ApiPropertyOptional({ type: () => SubjectPageItemResponseCountDto })
  _count?: SubjectPageItemResponseCountDto

  @ApiPropertyOptional({
    type: () => SubjectPageItemResponseTeachingAssignmentsDto,
    isArray: true,
  })
  teachingAssignments?: SubjectPageItemResponseTeachingAssignmentsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  code?: string | null

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(domain: SubjectWithEmployees): SubjectPageItemResponseDto {
    const dto = new SubjectPageItemResponseDto()
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : SubjectPageItemResponseCountDto.fromDomain(domain._count)
    if (domain.teachingAssignments !== undefined)
      dto.teachingAssignments =
        domain.teachingAssignments == null
          ? domain.teachingAssignments
          : domain.teachingAssignments.map((x) =>
              SubjectPageItemResponseTeachingAssignmentsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.description = domain.description
    dto.isActive = domain.isActive
    return dto
  }
}

export class SubjectPageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetSubjectsUseCase['execute']>>['meta'],
  ): SubjectPageResponseMetaDto {
    const dto = new SubjectPageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class SubjectPageResponseDto {
  @ApiProperty({ type: () => [SubjectPageItemResponseDto] })
  data!: SubjectPageItemResponseDto[]

  @ApiProperty({ type: () => SubjectPageResponseMetaDto })
  meta!: SubjectPageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetSubjectsUseCase['execute']>>,
  ): SubjectPageResponseDto {
    const dto = new SubjectPageResponseDto()
    dto.data = domain.data.map((item) =>
      SubjectPageItemResponseDto.fromDomain(item),
    )
    dto.meta = SubjectPageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class SubjectRecordResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  code?: string | null

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(domain: SubjectEntity): SubjectRecordResponseDto {
    const dto = new SubjectRecordResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.description = domain.description
    dto.isActive = domain.isActive
    return dto
  }
}
