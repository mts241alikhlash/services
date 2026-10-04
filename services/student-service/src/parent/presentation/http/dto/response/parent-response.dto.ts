import type { GetParentsUseCase } from '../../../../application/use-cases/get-parents/get-parents.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ParentWithDetails } from '../../../../domain/entities/parent.entity.js'

export class ParentResponseUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<NonNullable<ParentWithDetails['user']>['profile']>,
  ): ParentResponseUserProfileDto {
    const dto = new ParentResponseUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ParentResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ParentResponseUserProfileDto,
    nullable: true,
  })
  profile?: ParentResponseUserProfileDto | null

  static fromDomain(
    domain: NonNullable<ParentWithDetails['user']>,
  ): ParentResponseUserDto {
    const dto = new ParentResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ParentResponseUserProfileDto.fromDomain(domain.profile)
    return dto
  }
}

export class ParentResponseOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ParentWithDetails['occupation']>,
  ): ParentResponseOccupationDto {
    const dto = new ParentResponseOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ParentResponseEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ParentWithDetails['education']>,
  ): ParentResponseEducationDto {
    const dto = new ParentResponseEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ParentResponseStudentsDto {
  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  static fromDomain(
    domain: NonNullable<NonNullable<ParentWithDetails['students']>[number]>,
  ): ParentResponseStudentsDto {
    const dto = new ParentResponseStudentsDto()
    dto.studentId = domain.studentId
    dto.isPrimary = domain.isPrimary
    return dto
  }
}

export class ParentResponseCountDto {
  @ApiProperty({ type: Number })
  studentParents!: number

  static fromDomain(
    domain: NonNullable<ParentWithDetails['_count']>,
  ): ParentResponseCountDto {
    const dto = new ParentResponseCountDto()
    dto.studentParents = domain.studentParents
    return dto
  }
}

export class ParentResponseDto {
  @ApiPropertyOptional({ type: () => ParentResponseUserDto, nullable: true })
  user?: ParentResponseUserDto | null

  @ApiPropertyOptional({
    type: () => ParentResponseOccupationDto,
    nullable: true,
  })
  occupation?: ParentResponseOccupationDto | null

  @ApiPropertyOptional({
    type: () => ParentResponseEducationDto,
    nullable: true,
  })
  education?: ParentResponseEducationDto | null

  @ApiPropertyOptional({ type: () => ParentResponseStudentsDto, isArray: true })
  students?: ParentResponseStudentsDto[]

  @ApiPropertyOptional({ type: () => ParentResponseCountDto })
  _count?: ParentResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String })
  name?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  occupationId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  educationId?: string | null

  @ApiPropertyOptional({ type: String })
  birthPlace?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  birthDate?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({
    enum: [
      'BELOW_500K',
      'BETWEEN_500K_1M',
      'BETWEEN_1M_2M',
      'BETWEEN_2M_3M',
      'ABOVE_3M',
    ],
    nullable: true,
  })
  income?:
    | 'BELOW_500K'
    | 'BETWEEN_500K_1M'
    | 'BETWEEN_1M_2M'
    | 'BETWEEN_2M_3M'
    | 'ABOVE_3M'
    | null

  static fromDomain(domain: ParentWithDetails): ParentResponseDto {
    const dto = new ParentResponseDto()
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ParentResponseUserDto.fromDomain(domain.user)
    if (domain.occupation !== undefined)
      dto.occupation =
        domain.occupation == null
          ? domain.occupation
          : ParentResponseOccupationDto.fromDomain(domain.occupation)
    if (domain.education !== undefined)
      dto.education =
        domain.education == null
          ? domain.education
          : ParentResponseEducationDto.fromDomain(domain.education)
    if (domain.students !== undefined)
      dto.students =
        domain.students == null
          ? domain.students
          : domain.students.map((x) => ParentResponseStudentsDto.fromDomain(x))
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : ParentResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nik = domain.nik
    dto.name = domain.name
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.email = domain.email
    dto.phone = domain.phone
    dto.income = domain.income
    return dto
  }
}

export class ParentListItemResponseUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<NonNullable<ParentWithDetails['user']>['profile']>,
  ): ParentListItemResponseUserProfileDto {
    const dto = new ParentListItemResponseUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ParentListItemResponseUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ParentListItemResponseUserProfileDto,
    nullable: true,
  })
  profile?: ParentListItemResponseUserProfileDto | null

  static fromDomain(
    domain: NonNullable<ParentWithDetails['user']>,
  ): ParentListItemResponseUserDto {
    const dto = new ParentListItemResponseUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ParentListItemResponseUserProfileDto.fromDomain(domain.profile)
    return dto
  }
}

export class ParentListItemResponseOccupationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ParentWithDetails['occupation']>,
  ): ParentListItemResponseOccupationDto {
    const dto = new ParentListItemResponseOccupationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ParentListItemResponseEducationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ParentWithDetails['education']>,
  ): ParentListItemResponseEducationDto {
    const dto = new ParentListItemResponseEducationDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ParentListItemResponseStudentsDto {
  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  static fromDomain(
    domain: NonNullable<NonNullable<ParentWithDetails['students']>[number]>,
  ): ParentListItemResponseStudentsDto {
    const dto = new ParentListItemResponseStudentsDto()
    dto.studentId = domain.studentId
    dto.isPrimary = domain.isPrimary
    return dto
  }
}

export class ParentListItemResponseCountDto {
  @ApiProperty({ type: Number })
  studentParents!: number

  static fromDomain(
    domain: NonNullable<ParentWithDetails['_count']>,
  ): ParentListItemResponseCountDto {
    const dto = new ParentListItemResponseCountDto()
    dto.studentParents = domain.studentParents
    return dto
  }
}

export class ParentListItemResponseDto {
  @ApiPropertyOptional({
    type: () => ParentListItemResponseUserDto,
    nullable: true,
  })
  user?: ParentListItemResponseUserDto | null

  @ApiPropertyOptional({
    type: () => ParentListItemResponseOccupationDto,
    nullable: true,
  })
  occupation?: ParentListItemResponseOccupationDto | null

  @ApiPropertyOptional({
    type: () => ParentListItemResponseEducationDto,
    nullable: true,
  })
  education?: ParentListItemResponseEducationDto | null

  @ApiPropertyOptional({
    type: () => ParentListItemResponseStudentsDto,
    isArray: true,
  })
  students?: ParentListItemResponseStudentsDto[]

  @ApiPropertyOptional({ type: () => ParentListItemResponseCountDto })
  _count?: ParentListItemResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  nik?: string | null

  @ApiPropertyOptional({ type: String })
  name?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  occupationId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  educationId?: string | null

  @ApiPropertyOptional({ type: String })
  birthPlace?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  birthDate?: string

  @ApiPropertyOptional({ type: String, nullable: true })
  email?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null

  @ApiPropertyOptional({
    enum: [
      'BELOW_500K',
      'BETWEEN_500K_1M',
      'BETWEEN_1M_2M',
      'BETWEEN_2M_3M',
      'ABOVE_3M',
    ],
    nullable: true,
  })
  income?:
    | 'BELOW_500K'
    | 'BETWEEN_500K_1M'
    | 'BETWEEN_1M_2M'
    | 'BETWEEN_2M_3M'
    | 'ABOVE_3M'
    | null

  static fromDomain(domain: ParentWithDetails): ParentListItemResponseDto {
    const dto = new ParentListItemResponseDto()
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ParentListItemResponseUserDto.fromDomain(domain.user)
    if (domain.occupation !== undefined)
      dto.occupation =
        domain.occupation == null
          ? domain.occupation
          : ParentListItemResponseOccupationDto.fromDomain(domain.occupation)
    if (domain.education !== undefined)
      dto.education =
        domain.education == null
          ? domain.education
          : ParentListItemResponseEducationDto.fromDomain(domain.education)
    if (domain.students !== undefined)
      dto.students =
        domain.students == null
          ? domain.students
          : domain.students.map((x) =>
              ParentListItemResponseStudentsDto.fromDomain(x),
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : ParentListItemResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nik = domain.nik
    dto.name = domain.name
    dto.occupationId = domain.occupationId
    dto.educationId = domain.educationId
    dto.birthPlace = domain.birthPlace
    if (domain.birthDate !== undefined)
      dto.birthDate =
        domain.birthDate == null
          ? domain.birthDate
          : domain.birthDate.toISOString()
    dto.email = domain.email
    dto.phone = domain.phone
    dto.income = domain.income
    return dto
  }
}

export class ParentListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetParentsUseCase['execute']>>['meta'],
  ): ParentListResponseMetaDto {
    const dto = new ParentListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class ParentListResponseDto {
  @ApiProperty({ type: () => [ParentListItemResponseDto] })
  data!: ParentListItemResponseDto[]

  @ApiProperty({ type: () => ParentListResponseMetaDto })
  meta!: ParentListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetParentsUseCase['execute']>>,
  ): ParentListResponseDto {
    const dto = new ParentListResponseDto()
    dto.data = domain.data.map((item) =>
      ParentListItemResponseDto.fromDomain(item),
    )
    dto.meta = ParentListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
