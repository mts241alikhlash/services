import type { GetClassroomSupervisorsUseCase } from '../../../../application/use-cases/get-classroom-supervisors/get-classroom-supervisors.use-case.js'
import type { SupervisorWithDetails } from '../../../../domain/entities/classroom-supervisor.entity.js'
import type { GetClassroomStructuresUseCase } from '../../../../application/use-cases/get-classroom-structures/get-classroom-structures.use-case.js'
import type { StructureWithDetails } from '../../../../domain/entities/classroom-structure.entity.js'
import type { CopyClassroomsResult } from '../../../../domain/repositories/classroom.repository.js'
import type { GetClassroomsUseCase } from '../../../../application/use-cases/get-classrooms/get-classrooms.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetClassroomByIdUseCase } from '../../../../application/use-cases/get-classroom-by-id/get-classroom-by-id.use-case.js'

export class ClassroomItemResponseGradeDto {
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
      Awaited<ReturnType<GetClassroomByIdUseCase['execute']>>['grade']
    >,
  ): ClassroomItemResponseGradeDto {
    const dto = new ClassroomItemResponseGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetClassroomByIdUseCase['execute']>>['academicYear']
    >,
  ): ClassroomItemResponseAcademicYearDto {
    const dto = new ClassroomItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomItemResponseClassroomSupervisorsEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              Awaited<
                ReturnType<GetClassroomByIdUseCase['execute']>
              >['classroomSupervisors']
            >[number]
          >['employee']
        >['user']
      >['profile']
    >,
  ): ClassroomItemResponseClassroomSupervisorsEmployeeUserProfileDto {
    const dto =
      new ClassroomItemResponseClassroomSupervisorsEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomItemResponseClassroomSupervisorsEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomItemResponseClassroomSupervisorsEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomItemResponseClassroomSupervisorsEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            Awaited<
              ReturnType<GetClassroomByIdUseCase['execute']>
            >['classroomSupervisors']
          >[number]
        >['employee']
      >['user']
    >,
  ): ClassroomItemResponseClassroomSupervisorsEmployeeUserDto {
    const dto = new ClassroomItemResponseClassroomSupervisorsEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomItemResponseClassroomSupervisorsEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomItemResponseClassroomSupervisorsEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => ClassroomItemResponseClassroomSupervisorsEmployeeUserDto,
  })
  user?: ClassroomItemResponseClassroomSupervisorsEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetClassroomByIdUseCase['execute']>
          >['classroomSupervisors']
        >[number]
      >['employee']
    >,
  ): ClassroomItemResponseClassroomSupervisorsEmployeeDto {
    const dto = new ClassroomItemResponseClassroomSupervisorsEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomItemResponseClassroomSupervisorsEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomItemResponseClassroomSupervisorsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({
    type: () => ClassroomItemResponseClassroomSupervisorsEmployeeDto,
  })
  employee?: ClassroomItemResponseClassroomSupervisorsEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<GetClassroomByIdUseCase['execute']>
        >['classroomSupervisors']
      >[number]
    >,
  ): ClassroomItemResponseClassroomSupervisorsDto {
    const dto = new ClassroomItemResponseClassroomSupervisorsDto()
    dto.id = domain.id
    dto.classroomId = domain.classroomId
    dto.employeeId = domain.employeeId
    dto.semesterId = domain.semesterId
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : ClassroomItemResponseClassroomSupervisorsEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class ClassroomItemResponseDto {
  @ApiPropertyOptional({ type: () => ClassroomItemResponseGradeDto })
  grade?: ClassroomItemResponseGradeDto

  @ApiPropertyOptional({ type: () => ClassroomItemResponseAcademicYearDto })
  academicYear?: ClassroomItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => ClassroomItemResponseClassroomSupervisorsDto,
    isArray: true,
  })
  classroomSupervisors?: ClassroomItemResponseClassroomSupervisorsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  @ApiProperty({ type: String })
  displayName!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetClassroomByIdUseCase['execute']>>,
  ): ClassroomItemResponseDto {
    const dto = new ClassroomItemResponseDto()
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : ClassroomItemResponseGradeDto.fromDomain(domain.grade)
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : ClassroomItemResponseAcademicYearDto.fromDomain(domain.academicYear)
    if (domain.classroomSupervisors !== undefined)
      dto.classroomSupervisors =
        domain.classroomSupervisors == null
          ? domain.classroomSupervisors
          : domain.classroomSupervisors.map((x) =>
              ClassroomItemResponseClassroomSupervisorsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.capacity = domain.capacity
    dto.isActive = domain.isActive
    dto.displayName = domain.displayName
    return dto
  }
}

export class ClassroomPageItemResponseGradeDto {
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
      Awaited<
        ReturnType<GetClassroomsUseCase['execute']>
      >['data'][number]['grade']
    >,
  ): ClassroomPageItemResponseGradeDto {
    const dto = new ClassroomPageItemResponseGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomPageItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetClassroomsUseCase['execute']>
      >['data'][number]['academicYear']
    >,
  ): ClassroomPageItemResponseAcademicYearDto {
    const dto = new ClassroomPageItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomPageItemResponseClassroomSupervisorsEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              Awaited<
                ReturnType<GetClassroomsUseCase['execute']>
              >['data'][number]['classroomSupervisors']
            >[number]
          >['employee']
        >['user']
      >['profile']
    >,
  ): ClassroomPageItemResponseClassroomSupervisorsEmployeeUserProfileDto {
    const dto =
      new ClassroomPageItemResponseClassroomSupervisorsEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomPageItemResponseClassroomSupervisorsEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      ClassroomPageItemResponseClassroomSupervisorsEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomPageItemResponseClassroomSupervisorsEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            Awaited<
              ReturnType<GetClassroomsUseCase['execute']>
            >['data'][number]['classroomSupervisors']
          >[number]
        >['employee']
      >['user']
    >,
  ): ClassroomPageItemResponseClassroomSupervisorsEmployeeUserDto {
    const dto =
      new ClassroomPageItemResponseClassroomSupervisorsEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomPageItemResponseClassroomSupervisorsEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomPageItemResponseClassroomSupervisorsEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => ClassroomPageItemResponseClassroomSupervisorsEmployeeUserDto,
  })
  user?: ClassroomPageItemResponseClassroomSupervisorsEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          Awaited<
            ReturnType<GetClassroomsUseCase['execute']>
          >['data'][number]['classroomSupervisors']
        >[number]
      >['employee']
    >,
  ): ClassroomPageItemResponseClassroomSupervisorsEmployeeDto {
    const dto = new ClassroomPageItemResponseClassroomSupervisorsEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomPageItemResponseClassroomSupervisorsEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomPageItemResponseClassroomSupervisorsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({
    type: () => ClassroomPageItemResponseClassroomSupervisorsEmployeeDto,
  })
  employee?: ClassroomPageItemResponseClassroomSupervisorsEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<
          ReturnType<GetClassroomsUseCase['execute']>
        >['data'][number]['classroomSupervisors']
      >[number]
    >,
  ): ClassroomPageItemResponseClassroomSupervisorsDto {
    const dto = new ClassroomPageItemResponseClassroomSupervisorsDto()
    dto.id = domain.id
    dto.classroomId = domain.classroomId
    dto.employeeId = domain.employeeId
    dto.semesterId = domain.semesterId
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : ClassroomPageItemResponseClassroomSupervisorsEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class ClassroomPageItemResponseDto {
  @ApiPropertyOptional({ type: () => ClassroomPageItemResponseGradeDto })
  grade?: ClassroomPageItemResponseGradeDto

  @ApiPropertyOptional({ type: () => ClassroomPageItemResponseAcademicYearDto })
  academicYear?: ClassroomPageItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => ClassroomPageItemResponseClassroomSupervisorsDto,
    isArray: true,
  })
  classroomSupervisors?: ClassroomPageItemResponseClassroomSupervisorsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  @ApiProperty({ type: String })
  displayName!: string

  static fromDomain(
    domain: Awaited<
      ReturnType<GetClassroomsUseCase['execute']>
    >['data'][number],
  ): ClassroomPageItemResponseDto {
    const dto = new ClassroomPageItemResponseDto()
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : ClassroomPageItemResponseGradeDto.fromDomain(domain.grade)
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : ClassroomPageItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.classroomSupervisors !== undefined)
      dto.classroomSupervisors =
        domain.classroomSupervisors == null
          ? domain.classroomSupervisors
          : domain.classroomSupervisors.map((x) =>
              ClassroomPageItemResponseClassroomSupervisorsDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.capacity = domain.capacity
    dto.isActive = domain.isActive
    dto.displayName = domain.displayName
    return dto
  }
}

export class ClassroomPageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetClassroomsUseCase['execute']>>['meta'],
  ): ClassroomPageResponseMetaDto {
    const dto = new ClassroomPageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class ClassroomPageResponseDto {
  @ApiProperty({ type: () => [ClassroomPageItemResponseDto] })
  data!: ClassroomPageItemResponseDto[]

  @ApiProperty({ type: () => ClassroomPageResponseMetaDto })
  meta!: ClassroomPageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetClassroomsUseCase['execute']>>,
  ): ClassroomPageResponseDto {
    const dto = new ClassroomPageResponseDto()
    dto.data = domain.data.map((item) =>
      ClassroomPageItemResponseDto.fromDomain(item),
    )
    dto.meta = ClassroomPageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class CopyClassroomsResultResponseDto {
  @ApiProperty({ type: Number })
  created!: number

  @ApiProperty({ type: Number })
  skipped!: number

  static fromDomain(
    domain: CopyClassroomsResult,
  ): CopyClassroomsResultResponseDto {
    const dto = new CopyClassroomsResultResponseDto()
    dto.created = domain.created
    dto.skipped = domain.skipped
    return dto
  }
}

export class ClassroomStructureItemResponseClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: NonNullable<StructureWithDetails['classroom']>,
  ): ClassroomStructureItemResponseClassroomDto {
    const dto = new ClassroomStructureItemResponseClassroomDto()
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.capacity = domain.capacity
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomStructureItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<StructureWithDetails['semester']>['academicYear']
    >,
  ): ClassroomStructureItemResponseSemesterAcademicYearDto {
    const dto = new ClassroomStructureItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomStructureItemResponseSemesterDto {
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
    type: () => ClassroomStructureItemResponseSemesterAcademicYearDto,
  })
  academicYear?: ClassroomStructureItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['semester']>,
  ): ClassroomStructureItemResponseSemesterDto {
    const dto = new ClassroomStructureItemResponseSemesterDto()
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
          : ClassroomStructureItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class ClassroomStructureItemResponsePresidentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['president']>['user']
      >['profile']
    >,
  ): ClassroomStructureItemResponsePresidentUserProfileDto {
    const dto = new ClassroomStructureItemResponsePresidentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructureItemResponsePresidentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponsePresidentUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructureItemResponsePresidentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<StructureWithDetails['president']>['user']>,
  ): ClassroomStructureItemResponsePresidentUserDto {
    const dto = new ClassroomStructureItemResponsePresidentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructureItemResponsePresidentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructureItemResponsePresidentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponsePresidentUserDto,
  })
  user?: ClassroomStructureItemResponsePresidentUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['president']>,
  ): ClassroomStructureItemResponsePresidentDto {
    const dto = new ClassroomStructureItemResponsePresidentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructureItemResponsePresidentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseVicePresidentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['vicePresident']>['user']
      >['profile']
    >,
  ): ClassroomStructureItemResponseVicePresidentUserProfileDto {
    const dto = new ClassroomStructureItemResponseVicePresidentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructureItemResponseVicePresidentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseVicePresidentUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructureItemResponseVicePresidentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<StructureWithDetails['vicePresident']>['user']
    >,
  ): ClassroomStructureItemResponseVicePresidentUserDto {
    const dto = new ClassroomStructureItemResponseVicePresidentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructureItemResponseVicePresidentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseVicePresidentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseVicePresidentUserDto,
  })
  user?: ClassroomStructureItemResponseVicePresidentUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['vicePresident']>,
  ): ClassroomStructureItemResponseVicePresidentDto {
    const dto = new ClassroomStructureItemResponseVicePresidentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructureItemResponseVicePresidentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseSecretaryUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['secretary']>['user']
      >['profile']
    >,
  ): ClassroomStructureItemResponseSecretaryUserProfileDto {
    const dto = new ClassroomStructureItemResponseSecretaryUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructureItemResponseSecretaryUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseSecretaryUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructureItemResponseSecretaryUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<StructureWithDetails['secretary']>['user']>,
  ): ClassroomStructureItemResponseSecretaryUserDto {
    const dto = new ClassroomStructureItemResponseSecretaryUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructureItemResponseSecretaryUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseSecretaryDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseSecretaryUserDto,
  })
  user?: ClassroomStructureItemResponseSecretaryUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['secretary']>,
  ): ClassroomStructureItemResponseSecretaryDto {
    const dto = new ClassroomStructureItemResponseSecretaryDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructureItemResponseSecretaryUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseTreasurerUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['treasurer']>['user']
      >['profile']
    >,
  ): ClassroomStructureItemResponseTreasurerUserProfileDto {
    const dto = new ClassroomStructureItemResponseTreasurerUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructureItemResponseTreasurerUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseTreasurerUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructureItemResponseTreasurerUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<StructureWithDetails['treasurer']>['user']>,
  ): ClassroomStructureItemResponseTreasurerUserDto {
    const dto = new ClassroomStructureItemResponseTreasurerUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructureItemResponseTreasurerUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseTreasurerDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseTreasurerUserDto,
  })
  user?: ClassroomStructureItemResponseTreasurerUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['treasurer']>,
  ): ClassroomStructureItemResponseTreasurerDto {
    const dto = new ClassroomStructureItemResponseTreasurerDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructureItemResponseTreasurerUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructureItemResponseDto {
  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseClassroomDto,
  })
  classroom?: ClassroomStructureItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseSemesterDto,
  })
  semester?: ClassroomStructureItemResponseSemesterDto

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponsePresidentDto,
    nullable: true,
  })
  president?: ClassroomStructureItemResponsePresidentDto | null

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseVicePresidentDto,
    nullable: true,
  })
  vicePresident?: ClassroomStructureItemResponseVicePresidentDto | null

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseSecretaryDto,
    nullable: true,
  })
  secretary?: ClassroomStructureItemResponseSecretaryDto | null

  @ApiPropertyOptional({
    type: () => ClassroomStructureItemResponseTreasurerDto,
    nullable: true,
  })
  treasurer?: ClassroomStructureItemResponseTreasurerDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  presidentId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  vicePresidentId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  secretaryId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  treasurerId?: string | null

  static fromDomain(
    domain: StructureWithDetails,
  ): ClassroomStructureItemResponseDto {
    const dto = new ClassroomStructureItemResponseDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ClassroomStructureItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : ClassroomStructureItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    if (domain.president !== undefined)
      dto.president =
        domain.president == null
          ? domain.president
          : ClassroomStructureItemResponsePresidentDto.fromDomain(
              domain.president,
            )
    if (domain.vicePresident !== undefined)
      dto.vicePresident =
        domain.vicePresident == null
          ? domain.vicePresident
          : ClassroomStructureItemResponseVicePresidentDto.fromDomain(
              domain.vicePresident,
            )
    if (domain.secretary !== undefined)
      dto.secretary =
        domain.secretary == null
          ? domain.secretary
          : ClassroomStructureItemResponseSecretaryDto.fromDomain(
              domain.secretary,
            )
    if (domain.treasurer !== undefined)
      dto.treasurer =
        domain.treasurer == null
          ? domain.treasurer
          : ClassroomStructureItemResponseTreasurerDto.fromDomain(
              domain.treasurer,
            )
    dto.id = domain.id
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.presidentId = domain.presidentId
    dto.vicePresidentId = domain.vicePresidentId
    dto.secretaryId = domain.secretaryId
    dto.treasurerId = domain.treasurerId
    return dto
  }
}

export class ClassroomStructurePageItemResponseClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: NonNullable<StructureWithDetails['classroom']>,
  ): ClassroomStructurePageItemResponseClassroomDto {
    const dto = new ClassroomStructurePageItemResponseClassroomDto()
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.capacity = domain.capacity
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomStructurePageItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<StructureWithDetails['semester']>['academicYear']
    >,
  ): ClassroomStructurePageItemResponseSemesterAcademicYearDto {
    const dto = new ClassroomStructurePageItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomStructurePageItemResponseSemesterDto {
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
    type: () => ClassroomStructurePageItemResponseSemesterAcademicYearDto,
  })
  academicYear?: ClassroomStructurePageItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['semester']>,
  ): ClassroomStructurePageItemResponseSemesterDto {
    const dto = new ClassroomStructurePageItemResponseSemesterDto()
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
          : ClassroomStructurePageItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponsePresidentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['president']>['user']
      >['profile']
    >,
  ): ClassroomStructurePageItemResponsePresidentUserProfileDto {
    const dto = new ClassroomStructurePageItemResponsePresidentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructurePageItemResponsePresidentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponsePresidentUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructurePageItemResponsePresidentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<StructureWithDetails['president']>['user']>,
  ): ClassroomStructurePageItemResponsePresidentUserDto {
    const dto = new ClassroomStructurePageItemResponsePresidentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructurePageItemResponsePresidentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponsePresidentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponsePresidentUserDto,
  })
  user?: ClassroomStructurePageItemResponsePresidentUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['president']>,
  ): ClassroomStructurePageItemResponsePresidentDto {
    const dto = new ClassroomStructurePageItemResponsePresidentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructurePageItemResponsePresidentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseVicePresidentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['vicePresident']>['user']
      >['profile']
    >,
  ): ClassroomStructurePageItemResponseVicePresidentUserProfileDto {
    const dto =
      new ClassroomStructurePageItemResponseVicePresidentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructurePageItemResponseVicePresidentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseVicePresidentUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructurePageItemResponseVicePresidentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<StructureWithDetails['vicePresident']>['user']
    >,
  ): ClassroomStructurePageItemResponseVicePresidentUserDto {
    const dto = new ClassroomStructurePageItemResponseVicePresidentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructurePageItemResponseVicePresidentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseVicePresidentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseVicePresidentUserDto,
  })
  user?: ClassroomStructurePageItemResponseVicePresidentUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['vicePresident']>,
  ): ClassroomStructurePageItemResponseVicePresidentDto {
    const dto = new ClassroomStructurePageItemResponseVicePresidentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructurePageItemResponseVicePresidentUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseSecretaryUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['secretary']>['user']
      >['profile']
    >,
  ): ClassroomStructurePageItemResponseSecretaryUserProfileDto {
    const dto = new ClassroomStructurePageItemResponseSecretaryUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructurePageItemResponseSecretaryUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseSecretaryUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructurePageItemResponseSecretaryUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<StructureWithDetails['secretary']>['user']>,
  ): ClassroomStructurePageItemResponseSecretaryUserDto {
    const dto = new ClassroomStructurePageItemResponseSecretaryUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructurePageItemResponseSecretaryUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseSecretaryDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseSecretaryUserDto,
  })
  user?: ClassroomStructurePageItemResponseSecretaryUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['secretary']>,
  ): ClassroomStructurePageItemResponseSecretaryDto {
    const dto = new ClassroomStructurePageItemResponseSecretaryDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructurePageItemResponseSecretaryUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseTreasurerUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<StructureWithDetails['treasurer']>['user']
      >['profile']
    >,
  ): ClassroomStructurePageItemResponseTreasurerUserProfileDto {
    const dto = new ClassroomStructurePageItemResponseTreasurerUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomStructurePageItemResponseTreasurerUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseTreasurerUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomStructurePageItemResponseTreasurerUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<StructureWithDetails['treasurer']>['user']>,
  ): ClassroomStructurePageItemResponseTreasurerUserDto {
    const dto = new ClassroomStructurePageItemResponseTreasurerUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomStructurePageItemResponseTreasurerUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseTreasurerDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseTreasurerUserDto,
  })
  user?: ClassroomStructurePageItemResponseTreasurerUserDto

  static fromDomain(
    domain: NonNullable<StructureWithDetails['treasurer']>,
  ): ClassroomStructurePageItemResponseTreasurerDto {
    const dto = new ClassroomStructurePageItemResponseTreasurerDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomStructurePageItemResponseTreasurerUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomStructurePageItemResponseDto {
  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseClassroomDto,
  })
  classroom?: ClassroomStructurePageItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseSemesterDto,
  })
  semester?: ClassroomStructurePageItemResponseSemesterDto

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponsePresidentDto,
    nullable: true,
  })
  president?: ClassroomStructurePageItemResponsePresidentDto | null

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseVicePresidentDto,
    nullable: true,
  })
  vicePresident?: ClassroomStructurePageItemResponseVicePresidentDto | null

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseSecretaryDto,
    nullable: true,
  })
  secretary?: ClassroomStructurePageItemResponseSecretaryDto | null

  @ApiPropertyOptional({
    type: () => ClassroomStructurePageItemResponseTreasurerDto,
    nullable: true,
  })
  treasurer?: ClassroomStructurePageItemResponseTreasurerDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  presidentId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  vicePresidentId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  secretaryId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  treasurerId?: string | null

  static fromDomain(
    domain: StructureWithDetails,
  ): ClassroomStructurePageItemResponseDto {
    const dto = new ClassroomStructurePageItemResponseDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ClassroomStructurePageItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : ClassroomStructurePageItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    if (domain.president !== undefined)
      dto.president =
        domain.president == null
          ? domain.president
          : ClassroomStructurePageItemResponsePresidentDto.fromDomain(
              domain.president,
            )
    if (domain.vicePresident !== undefined)
      dto.vicePresident =
        domain.vicePresident == null
          ? domain.vicePresident
          : ClassroomStructurePageItemResponseVicePresidentDto.fromDomain(
              domain.vicePresident,
            )
    if (domain.secretary !== undefined)
      dto.secretary =
        domain.secretary == null
          ? domain.secretary
          : ClassroomStructurePageItemResponseSecretaryDto.fromDomain(
              domain.secretary,
            )
    if (domain.treasurer !== undefined)
      dto.treasurer =
        domain.treasurer == null
          ? domain.treasurer
          : ClassroomStructurePageItemResponseTreasurerDto.fromDomain(
              domain.treasurer,
            )
    dto.id = domain.id
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    dto.presidentId = domain.presidentId
    dto.vicePresidentId = domain.vicePresidentId
    dto.secretaryId = domain.secretaryId
    dto.treasurerId = domain.treasurerId
    return dto
  }
}

export class ClassroomStructurePageResponseMetaDto {
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
      ReturnType<GetClassroomStructuresUseCase['execute']>
    >['meta'],
  ): ClassroomStructurePageResponseMetaDto {
    const dto = new ClassroomStructurePageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class ClassroomStructurePageResponseDto {
  @ApiProperty({ type: () => [ClassroomStructurePageItemResponseDto] })
  data!: ClassroomStructurePageItemResponseDto[]

  @ApiProperty({ type: () => ClassroomStructurePageResponseMetaDto })
  meta!: ClassroomStructurePageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetClassroomStructuresUseCase['execute']>>,
  ): ClassroomStructurePageResponseDto {
    const dto = new ClassroomStructurePageResponseDto()
    dto.data = domain.data.map((item) =>
      ClassroomStructurePageItemResponseDto.fromDomain(item),
    )
    dto.meta = ClassroomStructurePageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class ClassroomSupervisorItemResponseClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: NonNullable<SupervisorWithDetails['classroom']>,
  ): ClassroomSupervisorItemResponseClassroomDto {
    const dto = new ClassroomSupervisorItemResponseClassroomDto()
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.capacity = domain.capacity
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomSupervisorItemResponseEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SupervisorWithDetails['employee']>['user']
      >['profile']
    >,
  ): ClassroomSupervisorItemResponseEmployeeUserProfileDto {
    const dto = new ClassroomSupervisorItemResponseEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomSupervisorItemResponseEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorItemResponseEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomSupervisorItemResponseEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<SupervisorWithDetails['employee']>['user']>,
  ): ClassroomSupervisorItemResponseEmployeeUserDto {
    const dto = new ClassroomSupervisorItemResponseEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomSupervisorItemResponseEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomSupervisorItemResponseEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorItemResponseEmployeeUserDto,
  })
  user?: ClassroomSupervisorItemResponseEmployeeUserDto

  static fromDomain(
    domain: NonNullable<SupervisorWithDetails['employee']>,
  ): ClassroomSupervisorItemResponseEmployeeDto {
    const dto = new ClassroomSupervisorItemResponseEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomSupervisorItemResponseEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomSupervisorItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<SupervisorWithDetails['semester']>['academicYear']
    >,
  ): ClassroomSupervisorItemResponseSemesterAcademicYearDto {
    const dto = new ClassroomSupervisorItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomSupervisorItemResponseSemesterDto {
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
    type: () => ClassroomSupervisorItemResponseSemesterAcademicYearDto,
  })
  academicYear?: ClassroomSupervisorItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<SupervisorWithDetails['semester']>,
  ): ClassroomSupervisorItemResponseSemesterDto {
    const dto = new ClassroomSupervisorItemResponseSemesterDto()
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
          : ClassroomSupervisorItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class ClassroomSupervisorItemResponseDto {
  @ApiPropertyOptional({
    type: () => ClassroomSupervisorItemResponseClassroomDto,
  })
  classroom?: ClassroomSupervisorItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorItemResponseEmployeeDto,
  })
  employee?: ClassroomSupervisorItemResponseEmployeeDto

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorItemResponseSemesterDto,
  })
  semester?: ClassroomSupervisorItemResponseSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  static fromDomain(
    domain: SupervisorWithDetails,
  ): ClassroomSupervisorItemResponseDto {
    const dto = new ClassroomSupervisorItemResponseDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ClassroomSupervisorItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : ClassroomSupervisorItemResponseEmployeeDto.fromDomain(
              domain.employee,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : ClassroomSupervisorItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    dto.id = domain.id
    dto.classroomId = domain.classroomId
    dto.employeeId = domain.employeeId
    dto.semesterId = domain.semesterId
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: NonNullable<SupervisorWithDetails['classroom']>,
  ): ClassroomSupervisorPageItemResponseClassroomDto {
    const dto = new ClassroomSupervisorPageItemResponseClassroomDto()
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.capacity = domain.capacity
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SupervisorWithDetails['employee']>['user']
      >['profile']
    >,
  ): ClassroomSupervisorPageItemResponseEmployeeUserProfileDto {
    const dto = new ClassroomSupervisorPageItemResponseEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorPageItemResponseEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: ClassroomSupervisorPageItemResponseEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<NonNullable<SupervisorWithDetails['employee']>['user']>,
  ): ClassroomSupervisorPageItemResponseEmployeeUserDto {
    const dto = new ClassroomSupervisorPageItemResponseEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ClassroomSupervisorPageItemResponseEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorPageItemResponseEmployeeUserDto,
  })
  user?: ClassroomSupervisorPageItemResponseEmployeeUserDto

  static fromDomain(
    domain: NonNullable<SupervisorWithDetails['employee']>,
  ): ClassroomSupervisorPageItemResponseEmployeeDto {
    const dto = new ClassroomSupervisorPageItemResponseEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ClassroomSupervisorPageItemResponseEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<SupervisorWithDetails['semester']>['academicYear']
    >,
  ): ClassroomSupervisorPageItemResponseSemesterAcademicYearDto {
    const dto = new ClassroomSupervisorPageItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseSemesterDto {
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
    type: () => ClassroomSupervisorPageItemResponseSemesterAcademicYearDto,
  })
  academicYear?: ClassroomSupervisorPageItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<SupervisorWithDetails['semester']>,
  ): ClassroomSupervisorPageItemResponseSemesterDto {
    const dto = new ClassroomSupervisorPageItemResponseSemesterDto()
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
          : ClassroomSupervisorPageItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class ClassroomSupervisorPageItemResponseDto {
  @ApiPropertyOptional({
    type: () => ClassroomSupervisorPageItemResponseClassroomDto,
  })
  classroom?: ClassroomSupervisorPageItemResponseClassroomDto

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorPageItemResponseEmployeeDto,
  })
  employee?: ClassroomSupervisorPageItemResponseEmployeeDto

  @ApiPropertyOptional({
    type: () => ClassroomSupervisorPageItemResponseSemesterDto,
  })
  semester?: ClassroomSupervisorPageItemResponseSemesterDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  static fromDomain(
    domain: SupervisorWithDetails,
  ): ClassroomSupervisorPageItemResponseDto {
    const dto = new ClassroomSupervisorPageItemResponseDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ClassroomSupervisorPageItemResponseClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : ClassroomSupervisorPageItemResponseEmployeeDto.fromDomain(
              domain.employee,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : ClassroomSupervisorPageItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    dto.id = domain.id
    dto.classroomId = domain.classroomId
    dto.employeeId = domain.employeeId
    dto.semesterId = domain.semesterId
    return dto
  }
}

export class ClassroomSupervisorPageResponseMetaDto {
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
      ReturnType<GetClassroomSupervisorsUseCase['execute']>
    >['meta'],
  ): ClassroomSupervisorPageResponseMetaDto {
    const dto = new ClassroomSupervisorPageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class ClassroomSupervisorPageResponseDto {
  @ApiProperty({ type: () => [ClassroomSupervisorPageItemResponseDto] })
  data!: ClassroomSupervisorPageItemResponseDto[]

  @ApiProperty({ type: () => ClassroomSupervisorPageResponseMetaDto })
  meta!: ClassroomSupervisorPageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetClassroomSupervisorsUseCase['execute']>>,
  ): ClassroomSupervisorPageResponseDto {
    const dto = new ClassroomSupervisorPageResponseDto()
    dto.data = domain.data.map((item) =>
      ClassroomSupervisorPageItemResponseDto.fromDomain(item),
    )
    dto.meta = ClassroomSupervisorPageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
