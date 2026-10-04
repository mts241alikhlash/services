import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { MyClassroom } from '../../../../application/use-cases/get-my-classroom/get-my-classroom.use-case.js'

export class MyClassroomResponseClassroomAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['classroom']>['academicYear']>,
  ): MyClassroomResponseClassroomAcademicYearDto {
    const dto = new MyClassroomResponseClassroomAcademicYearDto()
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              NonNullable<MyClassroom['classroom']>['classroomSupervisors']
            >[number]
          >['employee']
        >['user']
      >['profile']
    >,
  ): MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserProfileDto {
    const dto =
      new MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<MyClassroom['classroom']>['classroomSupervisors']
          >[number]
        >['employee']
      >['user']
    >,
  ): MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserDto {
    const dto =
      new MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseClassroomClassroomSupervisorsEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserDto,
  })
  user?: MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyClassroom['classroom']>['classroomSupervisors']
        >[number]
      >['employee']
    >,
  ): MyClassroomResponseClassroomClassroomSupervisorsEmployeeDto {
    const dto =
      new MyClassroomResponseClassroomClassroomSupervisorsEmployeeDto()
    dto.id = domain.id
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseClassroomClassroomSupervisorsEmployeeUserDto.fromDomain(
              domain.user,
            )
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseClassroomClassroomSupervisorsDto {
  @ApiProperty({ type: String })
  classroomId!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassroomClassroomSupervisorsEmployeeDto,
  })
  employee?: MyClassroomResponseClassroomClassroomSupervisorsEmployeeDto

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  semesterId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyClassroom['classroom']>['classroomSupervisors']
      >[number]
    >,
  ): MyClassroomResponseClassroomClassroomSupervisorsDto {
    const dto = new MyClassroomResponseClassroomClassroomSupervisorsDto()
    dto.classroomId = domain.classroomId
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : MyClassroomResponseClassroomClassroomSupervisorsEmployeeDto.fromDomain(
              domain.employee,
            )
    dto.employeeId = domain.employeeId
    dto.id = domain.id
    dto.semesterId = domain.semesterId
    return dto
  }
}

export class MyClassroomResponseClassroomGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['classroom']>['grade']>,
  ): MyClassroomResponseClassroomGradeDto {
    const dto = new MyClassroomResponseClassroomGradeDto()
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.level = domain.level
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassroomDto {
  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassroomAcademicYearDto,
  })
  academicYear?: MyClassroomResponseClassroomAcademicYearDto

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassroomClassroomSupervisorsDto,
    isArray: true,
  })
  classroomSupervisors?: MyClassroomResponseClassroomClassroomSupervisorsDto[]

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  displayName!: string

  @ApiPropertyOptional({ type: () => MyClassroomResponseClassroomGradeDto })
  grade?: MyClassroomResponseClassroomGradeDto

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<MyClassroom['classroom']>,
  ): MyClassroomResponseClassroomDto {
    const dto = new MyClassroomResponseClassroomDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : MyClassroomResponseClassroomAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    if (domain.classroomSupervisors !== undefined)
      dto.classroomSupervisors =
        domain.classroomSupervisors == null
          ? domain.classroomSupervisors
          : domain.classroomSupervisors.map((x) =>
              MyClassroomResponseClassroomClassroomSupervisorsDto.fromDomain(x),
            )
    dto.code = domain.code
    dto.displayName = domain.displayName
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : MyClassroomResponseClassroomGradeDto.fromDomain(domain.grade)
    dto.gradeId = domain.gradeId
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructureClassroomDto {
  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['structure']>['classroom']>,
  ): MyClassroomResponseStructureClassroomDto {
    const dto = new MyClassroomResponseStructureClassroomDto()
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    dto.code = domain.code
    dto.gradeId = domain.gradeId
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructurePresidentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['structure']>['president']>['user']
      >['profile']
    >,
  ): MyClassroomResponseStructurePresidentUserProfileDto {
    const dto = new MyClassroomResponseStructurePresidentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructurePresidentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructurePresidentUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseStructurePresidentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['structure']>['president']>['user']
    >,
  ): MyClassroomResponseStructurePresidentUserDto {
    const dto = new MyClassroomResponseStructurePresidentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseStructurePresidentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseStructurePresidentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructurePresidentUserDto,
  })
  user?: MyClassroomResponseStructurePresidentUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['structure']>['president']>,
  ): MyClassroomResponseStructurePresidentDto {
    const dto = new MyClassroomResponseStructurePresidentDto()
    dto.id = domain.id
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseStructurePresidentUserDto.fromDomain(domain.user)
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseStructureSecretaryUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['structure']>['secretary']>['user']
      >['profile']
    >,
  ): MyClassroomResponseStructureSecretaryUserProfileDto {
    const dto = new MyClassroomResponseStructureSecretaryUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructureSecretaryUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureSecretaryUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseStructureSecretaryUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['structure']>['secretary']>['user']
    >,
  ): MyClassroomResponseStructureSecretaryUserDto {
    const dto = new MyClassroomResponseStructureSecretaryUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseStructureSecretaryUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseStructureSecretaryDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureSecretaryUserDto,
  })
  user?: MyClassroomResponseStructureSecretaryUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['structure']>['secretary']>,
  ): MyClassroomResponseStructureSecretaryDto {
    const dto = new MyClassroomResponseStructureSecretaryDto()
    dto.id = domain.id
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseStructureSecretaryUserDto.fromDomain(domain.user)
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseStructureSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyClassroom['structure']>['semester']
      >['academicYear']
    >,
  ): MyClassroomResponseStructureSemesterAcademicYearDto {
    const dto = new MyClassroomResponseStructureSemesterAcademicYearDto()
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructureSemesterDto {
  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureSemesterAcademicYearDto,
  })
  academicYear?: MyClassroomResponseStructureSemesterAcademicYearDto

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String, nullable: true })
  endDate!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, nullable: true })
  startDate!: string | null

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['structure']>['semester']>,
  ): MyClassroomResponseStructureSemesterDto {
    const dto = new MyClassroomResponseStructureSemesterDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : MyClassroomResponseStructureSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    dto.academicYearId = domain.academicYearId
    dto.endDate = domain.endDate
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.startDate = domain.startDate
    dto.typeId = domain.typeId
    return dto
  }
}

export class MyClassroomResponseStructureTreasurerUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['structure']>['treasurer']>['user']
      >['profile']
    >,
  ): MyClassroomResponseStructureTreasurerUserProfileDto {
    const dto = new MyClassroomResponseStructureTreasurerUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructureTreasurerUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureTreasurerUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseStructureTreasurerUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['structure']>['treasurer']>['user']
    >,
  ): MyClassroomResponseStructureTreasurerUserDto {
    const dto = new MyClassroomResponseStructureTreasurerUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseStructureTreasurerUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseStructureTreasurerDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureTreasurerUserDto,
  })
  user?: MyClassroomResponseStructureTreasurerUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['structure']>['treasurer']>,
  ): MyClassroomResponseStructureTreasurerDto {
    const dto = new MyClassroomResponseStructureTreasurerDto()
    dto.id = domain.id
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseStructureTreasurerUserDto.fromDomain(domain.user)
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseStructureVicePresidentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyClassroom['structure']>['vicePresident']
        >['user']
      >['profile']
    >,
  ): MyClassroomResponseStructureVicePresidentUserProfileDto {
    const dto = new MyClassroomResponseStructureVicePresidentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseStructureVicePresidentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureVicePresidentUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseStructureVicePresidentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyClassroom['structure']>['vicePresident']
      >['user']
    >,
  ): MyClassroomResponseStructureVicePresidentUserDto {
    const dto = new MyClassroomResponseStructureVicePresidentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseStructureVicePresidentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseStructureVicePresidentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  nis!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureVicePresidentUserDto,
  })
  user?: MyClassroomResponseStructureVicePresidentUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['structure']>['vicePresident']>,
  ): MyClassroomResponseStructureVicePresidentDto {
    const dto = new MyClassroomResponseStructureVicePresidentDto()
    dto.id = domain.id
    dto.nis = domain.nis
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseStructureVicePresidentUserDto.fromDomain(
              domain.user,
            )
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseStructureDto {
  @ApiPropertyOptional({ type: () => MyClassroomResponseStructureClassroomDto })
  classroom?: MyClassroomResponseStructureClassroomDto

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructurePresidentDto,
    nullable: true,
  })
  president?: MyClassroomResponseStructurePresidentDto | null

  @ApiPropertyOptional({ type: String, nullable: true })
  presidentId?: string | null

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureSecretaryDto,
    nullable: true,
  })
  secretary?: MyClassroomResponseStructureSecretaryDto | null

  @ApiPropertyOptional({ type: String, nullable: true })
  secretaryId?: string | null

  @ApiPropertyOptional({ type: () => MyClassroomResponseStructureSemesterDto })
  semester?: MyClassroomResponseStructureSemesterDto

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureTreasurerDto,
    nullable: true,
  })
  treasurer?: MyClassroomResponseStructureTreasurerDto | null

  @ApiPropertyOptional({ type: String, nullable: true })
  treasurerId?: string | null

  @ApiPropertyOptional({
    type: () => MyClassroomResponseStructureVicePresidentDto,
    nullable: true,
  })
  vicePresident?: MyClassroomResponseStructureVicePresidentDto | null

  @ApiPropertyOptional({ type: String, nullable: true })
  vicePresidentId?: string | null

  static fromDomain(
    domain: NonNullable<MyClassroom['structure']>,
  ): MyClassroomResponseStructureDto {
    const dto = new MyClassroomResponseStructureDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : MyClassroomResponseStructureClassroomDto.fromDomain(
              domain.classroom,
            )
    dto.classroomId = domain.classroomId
    dto.id = domain.id
    if (domain.president !== undefined)
      dto.president =
        domain.president == null
          ? domain.president
          : MyClassroomResponseStructurePresidentDto.fromDomain(
              domain.president,
            )
    dto.presidentId = domain.presidentId
    if (domain.secretary !== undefined)
      dto.secretary =
        domain.secretary == null
          ? domain.secretary
          : MyClassroomResponseStructureSecretaryDto.fromDomain(
              domain.secretary,
            )
    dto.secretaryId = domain.secretaryId
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : MyClassroomResponseStructureSemesterDto.fromDomain(domain.semester)
    dto.semesterId = domain.semesterId
    if (domain.treasurer !== undefined)
      dto.treasurer =
        domain.treasurer == null
          ? domain.treasurer
          : MyClassroomResponseStructureTreasurerDto.fromDomain(
              domain.treasurer,
            )
    dto.treasurerId = domain.treasurerId
    if (domain.vicePresident !== undefined)
      dto.vicePresident =
        domain.vicePresident == null
          ? domain.vicePresident
          : MyClassroomResponseStructureVicePresidentDto.fromDomain(
              domain.vicePresident,
            )
    dto.vicePresidentId = domain.vicePresidentId
    return dto
  }
}

export class MyClassroomResponseSupervisorClassroomDto {
  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['supervisor']>['classroom']>,
  ): MyClassroomResponseSupervisorClassroomDto {
    const dto = new MyClassroomResponseSupervisorClassroomDto()
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    dto.code = domain.code
    dto.gradeId = domain.gradeId
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSupervisorEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['supervisor']>['employee']>['user']
      >['profile']
    >,
  ): MyClassroomResponseSupervisorEmployeeUserProfileDto {
    const dto = new MyClassroomResponseSupervisorEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSupervisorEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseSupervisorEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseSupervisorEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['supervisor']>['employee']>['user']
    >,
  ): MyClassroomResponseSupervisorEmployeeUserDto {
    const dto = new MyClassroomResponseSupervisorEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseSupervisorEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseSupervisorEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => MyClassroomResponseSupervisorEmployeeUserDto,
  })
  user?: MyClassroomResponseSupervisorEmployeeUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['supervisor']>['employee']>,
  ): MyClassroomResponseSupervisorEmployeeDto {
    const dto = new MyClassroomResponseSupervisorEmployeeDto()
    dto.id = domain.id
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseSupervisorEmployeeUserDto.fromDomain(domain.user)
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseSupervisorSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyClassroom['supervisor']>['semester']
      >['academicYear']
    >,
  ): MyClassroomResponseSupervisorSemesterAcademicYearDto {
    const dto = new MyClassroomResponseSupervisorSemesterAcademicYearDto()
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSupervisorSemesterDto {
  @ApiPropertyOptional({
    type: () => MyClassroomResponseSupervisorSemesterAcademicYearDto,
  })
  academicYear?: MyClassroomResponseSupervisorSemesterAcademicYearDto

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String, nullable: true })
  endDate!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, nullable: true })
  startDate!: string | null

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['supervisor']>['semester']>,
  ): MyClassroomResponseSupervisorSemesterDto {
    const dto = new MyClassroomResponseSupervisorSemesterDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : MyClassroomResponseSupervisorSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    dto.academicYearId = domain.academicYearId
    dto.endDate = domain.endDate
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.startDate = domain.startDate
    dto.typeId = domain.typeId
    return dto
  }
}

export class MyClassroomResponseSupervisorDto {
  @ApiPropertyOptional({
    type: () => MyClassroomResponseSupervisorClassroomDto,
  })
  classroom?: MyClassroomResponseSupervisorClassroomDto

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiPropertyOptional({ type: () => MyClassroomResponseSupervisorEmployeeDto })
  employee?: MyClassroomResponseSupervisorEmployeeDto

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: () => MyClassroomResponseSupervisorSemesterDto })
  semester?: MyClassroomResponseSupervisorSemesterDto

  @ApiProperty({ type: String })
  semesterId!: string

  static fromDomain(
    domain: NonNullable<MyClassroom['supervisor']>,
  ): MyClassroomResponseSupervisorDto {
    const dto = new MyClassroomResponseSupervisorDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : MyClassroomResponseSupervisorClassroomDto.fromDomain(
              domain.classroom,
            )
    dto.classroomId = domain.classroomId
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : MyClassroomResponseSupervisorEmployeeDto.fromDomain(domain.employee)
    dto.employeeId = domain.employeeId
    dto.id = domain.id
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : MyClassroomResponseSupervisorSemesterDto.fromDomain(domain.semester)
    dto.semesterId = domain.semesterId
    return dto
  }
}

export class MyClassroomResponseClassmatesStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<NonNullable<MyClassroom['classmates']>[number]>['student']
        >['user']
      >['profile']
    >,
  ): MyClassroomResponseClassmatesStudentUserProfileDto {
    const dto = new MyClassroomResponseClassmatesStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassmatesStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassmatesStudentUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseClassmatesStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['classmates']>[number]>['student']
      >['user']
    >,
  ): MyClassroomResponseClassmatesStudentUserDto {
    const dto = new MyClassroomResponseClassmatesStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseClassmatesStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseClassmatesStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassmatesStudentUserDto,
  })
  user?: MyClassroomResponseClassmatesStudentUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['classmates']>[number]>['student']
    >,
  ): MyClassroomResponseClassmatesStudentDto {
    const dto = new MyClassroomResponseClassmatesStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseClassmatesStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class MyClassroomResponseClassmatesClassroomGradeDto {
  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['classmates']>[number]>['classroom']
      >['grade']
    >,
  ): MyClassroomResponseClassmatesClassroomGradeDto {
    const dto = new MyClassroomResponseClassmatesClassroomGradeDto()
    dto.level = domain.level
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassmatesClassroomDto {
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
    type: () => MyClassroomResponseClassmatesClassroomGradeDto,
    nullable: true,
  })
  grade!: MyClassroomResponseClassmatesClassroomGradeDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['classmates']>[number]>['classroom']
    >,
  ): MyClassroomResponseClassmatesClassroomDto {
    const dto = new MyClassroomResponseClassmatesClassroomDto()
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
        : MyClassroomResponseClassmatesClassroomGradeDto.fromDomain(
            domain.grade,
          )
    return dto
  }
}

export class MyClassroomResponseClassmatesSemesterTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['classmates']>[number]>['semester']
      >['type']
    >,
  ): MyClassroomResponseClassmatesSemesterTypeDto {
    const dto = new MyClassroomResponseClassmatesSemesterTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassmatesSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['classmates']>[number]>['semester']
      >['academicYear']
    >,
  ): MyClassroomResponseClassmatesSemesterAcademicYearDto {
    const dto = new MyClassroomResponseClassmatesSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseClassmatesSemesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({
    type: () => MyClassroomResponseClassmatesSemesterTypeDto,
    nullable: true,
  })
  type!: MyClassroomResponseClassmatesSemesterTypeDto | null

  @ApiProperty({
    type: () => MyClassroomResponseClassmatesSemesterAcademicYearDto,
    nullable: true,
  })
  academicYear!: MyClassroomResponseClassmatesSemesterAcademicYearDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['classmates']>[number]>['semester']
    >,
  ): MyClassroomResponseClassmatesSemesterDto {
    const dto = new MyClassroomResponseClassmatesSemesterDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.isActive = domain.isActive
    dto.type =
      domain.type == null
        ? domain.type
        : MyClassroomResponseClassmatesSemesterTypeDto.fromDomain(domain.type)
    dto.academicYear =
      domain.academicYear == null
        ? domain.academicYear
        : MyClassroomResponseClassmatesSemesterAcademicYearDto.fromDomain(
            domain.academicYear,
          )
    return dto
  }
}

export class MyClassroomResponseClassmatesDto {
  @ApiPropertyOptional({ type: () => MyClassroomResponseClassmatesStudentDto })
  student?: MyClassroomResponseClassmatesStudentDto

  @ApiPropertyOptional({
    type: () => MyClassroomResponseClassmatesClassroomDto,
  })
  classroom?: MyClassroomResponseClassmatesClassroomDto

  @ApiPropertyOptional({ type: () => MyClassroomResponseClassmatesSemesterDto })
  semester?: MyClassroomResponseClassmatesSemesterDto

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
    domain: NonNullable<NonNullable<MyClassroom['classmates']>[number]>,
  ): MyClassroomResponseClassmatesDto {
    const dto = new MyClassroomResponseClassmatesDto()
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : MyClassroomResponseClassmatesStudentDto.fromDomain(domain.student)
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : MyClassroomResponseClassmatesClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : MyClassroomResponseClassmatesSemesterDto.fromDomain(domain.semester)
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

export class MyClassroomResponseSubjectsClassroomGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['subjects']>[number]>['classroom']
      >['grade']
    >,
  ): MyClassroomResponseSubjectsClassroomGradeDto {
    const dto = new MyClassroomResponseSubjectsClassroomGradeDto()
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.level = domain.level
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSubjectsClassroomDto {
  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: Number })
  capacity!: number

  @ApiProperty({ type: String })
  code!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseSubjectsClassroomGradeDto,
  })
  grade?: MyClassroomResponseSubjectsClassroomGradeDto

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['subjects']>[number]>['classroom']
    >,
  ): MyClassroomResponseSubjectsClassroomDto {
    const dto = new MyClassroomResponseSubjectsClassroomDto()
    dto.academicYearId = domain.academicYearId
    dto.capacity = domain.capacity
    dto.code = domain.code
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : MyClassroomResponseSubjectsClassroomGradeDto.fromDomain(
              domain.grade,
            )
    dto.gradeId = domain.gradeId
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSubjectsEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<NonNullable<MyClassroom['subjects']>[number]>['employee']
        >['user']
      >['profile']
    >,
  ): MyClassroomResponseSubjectsEmployeeUserProfileDto {
    const dto = new MyClassroomResponseSubjectsEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSubjectsEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => MyClassroomResponseSubjectsEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: MyClassroomResponseSubjectsEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['subjects']>[number]>['employee']
      >['user']
    >,
  ): MyClassroomResponseSubjectsEmployeeUserDto {
    const dto = new MyClassroomResponseSubjectsEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyClassroomResponseSubjectsEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyClassroomResponseSubjectsEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({
    type: () => MyClassroomResponseSubjectsEmployeeUserDto,
  })
  user?: MyClassroomResponseSubjectsEmployeeUserDto

  @ApiProperty({ type: String })
  userId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['subjects']>[number]>['employee']
    >,
  ): MyClassroomResponseSubjectsEmployeeDto {
    const dto = new MyClassroomResponseSubjectsEmployeeDto()
    dto.id = domain.id
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyClassroomResponseSubjectsEmployeeUserDto.fromDomain(domain.user)
    dto.userId = domain.userId
    return dto
  }
}

export class MyClassroomResponseSubjectsSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<MyClassroom['subjects']>[number]>['semester']
      >['academicYear']
    >,
  ): MyClassroomResponseSubjectsSemesterAcademicYearDto {
    const dto = new MyClassroomResponseSubjectsSemesterAcademicYearDto()
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSubjectsSemesterDto {
  @ApiPropertyOptional({
    type: () => MyClassroomResponseSubjectsSemesterAcademicYearDto,
  })
  academicYear?: MyClassroomResponseSubjectsSemesterAcademicYearDto

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String, nullable: true })
  endDate!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, nullable: true })
  startDate!: string | null

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['subjects']>[number]>['semester']
    >,
  ): MyClassroomResponseSubjectsSemesterDto {
    const dto = new MyClassroomResponseSubjectsSemesterDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : MyClassroomResponseSubjectsSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    dto.academicYearId = domain.academicYearId
    dto.endDate = domain.endDate
    dto.id = domain.id
    dto.isActive = domain.isActive
    dto.startDate = domain.startDate
    dto.typeId = domain.typeId
    return dto
  }
}

export class MyClassroomResponseSubjectsSubjectDto {
  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyClassroom['subjects']>[number]>['subject']
    >,
  ): MyClassroomResponseSubjectsSubjectDto {
    const dto = new MyClassroomResponseSubjectsSubjectDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class MyClassroomResponseSubjectsDto {
  @ApiPropertyOptional({ type: () => MyClassroomResponseSubjectsClassroomDto })
  classroom?: MyClassroomResponseSubjectsClassroomDto

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiPropertyOptional({ type: () => MyClassroomResponseSubjectsEmployeeDto })
  employee?: MyClassroomResponseSubjectsEmployeeDto

  @ApiProperty({ type: String })
  employeeId!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  passingScore?: number | null

  @ApiPropertyOptional({ type: () => MyClassroomResponseSubjectsSemesterDto })
  semester?: MyClassroomResponseSubjectsSemesterDto

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: () => MyClassroomResponseSubjectsSubjectDto })
  subject?: MyClassroomResponseSubjectsSubjectDto

  @ApiProperty({ type: String })
  subjectId!: string

  static fromDomain(
    domain: NonNullable<NonNullable<MyClassroom['subjects']>[number]>,
  ): MyClassroomResponseSubjectsDto {
    const dto = new MyClassroomResponseSubjectsDto()
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : MyClassroomResponseSubjectsClassroomDto.fromDomain(domain.classroom)
    dto.classroomId = domain.classroomId
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : MyClassroomResponseSubjectsEmployeeDto.fromDomain(domain.employee)
    dto.employeeId = domain.employeeId
    dto.id = domain.id
    dto.passingScore = domain.passingScore
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : MyClassroomResponseSubjectsSemesterDto.fromDomain(domain.semester)
    dto.semesterId = domain.semesterId
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : MyClassroomResponseSubjectsSubjectDto.fromDomain(domain.subject)
    dto.subjectId = domain.subjectId
    return dto
  }
}

export class MyClassroomResponseDto {
  @ApiProperty({ type: () => MyClassroomResponseClassroomDto })
  classroom!: MyClassroomResponseClassroomDto

  @ApiProperty({ type: () => MyClassroomResponseStructureDto, nullable: true })
  structure!: MyClassroomResponseStructureDto | null

  @ApiProperty({ type: () => MyClassroomResponseSupervisorDto, nullable: true })
  supervisor!: MyClassroomResponseSupervisorDto | null

  @ApiProperty({ type: () => MyClassroomResponseClassmatesDto, isArray: true })
  classmates!: MyClassroomResponseClassmatesDto[]

  @ApiProperty({ type: () => MyClassroomResponseSubjectsDto, isArray: true })
  subjects!: MyClassroomResponseSubjectsDto[]

  static fromDomain(domain: MyClassroom): MyClassroomResponseDto {
    const dto = new MyClassroomResponseDto()
    dto.classroom = MyClassroomResponseClassroomDto.fromDomain(domain.classroom)
    dto.structure =
      domain.structure == null
        ? domain.structure
        : MyClassroomResponseStructureDto.fromDomain(domain.structure)
    dto.supervisor =
      domain.supervisor == null
        ? domain.supervisor
        : MyClassroomResponseSupervisorDto.fromDomain(domain.supervisor)
    dto.classmates = domain.classmates.map((x) =>
      MyClassroomResponseClassmatesDto.fromDomain(x),
    )
    dto.subjects = domain.subjects.map((x) =>
      MyClassroomResponseSubjectsDto.fromDomain(x),
    )
    return dto
  }
}
