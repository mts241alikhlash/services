import type { TimeSlotTypeEntity } from '../../../../domain/entities/time-slot-type.entity.js'
import type { TimeSlotWithType } from '../../../../domain/entities/time-slot.entity.js'
import type { BatchUpsertScheduleUseCase } from '../../../../application/use-cases/batch-upsert-schedule/batch-upsert-schedule.use-case.js'
import type { MyScheduleResult } from '../../../../application/use-cases/get-my-schedule/get-my-schedule.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ScheduleWithDetails } from '../../../../domain/entities/schedule.entity.js'

export class ScheduleItemResponseTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<ScheduleWithDetails['teachingAssignment']>['subject']
    >,
  ): ScheduleItemResponseTeachingAssignmentSubjectDto {
    const dto = new ScheduleItemResponseTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class ScheduleItemResponseTeachingAssignmentClassroomGradeDto {
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
        NonNullable<ScheduleWithDetails['teachingAssignment']>['classroom']
      >['grade']
    >,
  ): ScheduleItemResponseTeachingAssignmentClassroomGradeDto {
    const dto = new ScheduleItemResponseTeachingAssignmentClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ScheduleItemResponseTeachingAssignmentClassroomDto {
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
    type: () => ScheduleItemResponseTeachingAssignmentClassroomGradeDto,
  })
  grade?: ScheduleItemResponseTeachingAssignmentClassroomGradeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<ScheduleWithDetails['teachingAssignment']>['classroom']
    >,
  ): ScheduleItemResponseTeachingAssignmentClassroomDto {
    const dto = new ScheduleItemResponseTeachingAssignmentClassroomDto()
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
          : ScheduleItemResponseTeachingAssignmentClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class ScheduleItemResponseTeachingAssignmentEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<ScheduleWithDetails['teachingAssignment']>['employee']
        >['user']
      >['profile']
    >,
  ): ScheduleItemResponseTeachingAssignmentEmployeeUserProfileDto {
    const dto =
      new ScheduleItemResponseTeachingAssignmentEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class ScheduleItemResponseTeachingAssignmentEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => ScheduleItemResponseTeachingAssignmentEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: ScheduleItemResponseTeachingAssignmentEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<ScheduleWithDetails['teachingAssignment']>['employee']
      >['user']
    >,
  ): ScheduleItemResponseTeachingAssignmentEmployeeUserDto {
    const dto = new ScheduleItemResponseTeachingAssignmentEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : ScheduleItemResponseTeachingAssignmentEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class ScheduleItemResponseTeachingAssignmentEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => ScheduleItemResponseTeachingAssignmentEmployeeUserDto,
  })
  user?: ScheduleItemResponseTeachingAssignmentEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<ScheduleWithDetails['teachingAssignment']>['employee']
    >,
  ): ScheduleItemResponseTeachingAssignmentEmployeeDto {
    const dto = new ScheduleItemResponseTeachingAssignmentEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : ScheduleItemResponseTeachingAssignmentEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class ScheduleItemResponseTeachingAssignmentDto {
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

  @ApiPropertyOptional({
    type: () => ScheduleItemResponseTeachingAssignmentSubjectDto,
  })
  subject?: ScheduleItemResponseTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () => ScheduleItemResponseTeachingAssignmentClassroomDto,
  })
  classroom?: ScheduleItemResponseTeachingAssignmentClassroomDto

  @ApiPropertyOptional({
    type: () => ScheduleItemResponseTeachingAssignmentEmployeeDto,
  })
  employee?: ScheduleItemResponseTeachingAssignmentEmployeeDto

  static fromDomain(
    domain: NonNullable<ScheduleWithDetails['teachingAssignment']>,
  ): ScheduleItemResponseTeachingAssignmentDto {
    const dto = new ScheduleItemResponseTeachingAssignmentDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroomId = domain.classroomId
    dto.subjectId = domain.subjectId
    dto.semesterId = domain.semesterId
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : ScheduleItemResponseTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : ScheduleItemResponseTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : ScheduleItemResponseTeachingAssignmentEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class ScheduleItemResponseTimeSlotDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: Number })
  order!: number

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<ScheduleWithDetails['timeSlot']>,
  ): ScheduleItemResponseTimeSlotDto {
    const dto = new ScheduleItemResponseTimeSlotDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.order = domain.order
    dto.typeId = domain.typeId
    return dto
  }
}

export class ScheduleItemResponseDto {
  @ApiPropertyOptional({
    type: () => ScheduleItemResponseTeachingAssignmentDto,
  })
  teachingAssignment?: ScheduleItemResponseTeachingAssignmentDto

  @ApiPropertyOptional({ type: () => ScheduleItemResponseTimeSlotDto })
  timeSlot?: ScheduleItemResponseTimeSlotDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  teachingAssignmentId!: string

  @ApiProperty({ type: String })
  timeSlotId!: string

  @ApiProperty({ type: String })
  day!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  static fromDomain(domain: ScheduleWithDetails): ScheduleItemResponseDto {
    const dto = new ScheduleItemResponseDto()
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : ScheduleItemResponseTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    if (domain.timeSlot !== undefined)
      dto.timeSlot =
        domain.timeSlot == null
          ? domain.timeSlot
          : ScheduleItemResponseTimeSlotDto.fromDomain(domain.timeSlot)
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.timeSlotId = domain.timeSlotId
    dto.day = domain.day
    dto.room = domain.room
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<ScheduleWithDetails['teachingAssignment']>['subject']
    >,
  ): SchedulePageItemResponseTeachingAssignmentSubjectDto {
    const dto = new SchedulePageItemResponseTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentClassroomGradeDto {
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
        NonNullable<ScheduleWithDetails['teachingAssignment']>['classroom']
      >['grade']
    >,
  ): SchedulePageItemResponseTeachingAssignmentClassroomGradeDto {
    const dto =
      new SchedulePageItemResponseTeachingAssignmentClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentClassroomDto {
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
    type: () => SchedulePageItemResponseTeachingAssignmentClassroomGradeDto,
  })
  grade?: SchedulePageItemResponseTeachingAssignmentClassroomGradeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<ScheduleWithDetails['teachingAssignment']>['classroom']
    >,
  ): SchedulePageItemResponseTeachingAssignmentClassroomDto {
    const dto = new SchedulePageItemResponseTeachingAssignmentClassroomDto()
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
          : SchedulePageItemResponseTeachingAssignmentClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<ScheduleWithDetails['teachingAssignment']>['employee']
        >['user']
      >['profile']
    >,
  ): SchedulePageItemResponseTeachingAssignmentEmployeeUserProfileDto {
    const dto =
      new SchedulePageItemResponseTeachingAssignmentEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      SchedulePageItemResponseTeachingAssignmentEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: SchedulePageItemResponseTeachingAssignmentEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<ScheduleWithDetails['teachingAssignment']>['employee']
      >['user']
    >,
  ): SchedulePageItemResponseTeachingAssignmentEmployeeUserDto {
    const dto = new SchedulePageItemResponseTeachingAssignmentEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : SchedulePageItemResponseTeachingAssignmentEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => SchedulePageItemResponseTeachingAssignmentEmployeeUserDto,
  })
  user?: SchedulePageItemResponseTeachingAssignmentEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<ScheduleWithDetails['teachingAssignment']>['employee']
    >,
  ): SchedulePageItemResponseTeachingAssignmentEmployeeDto {
    const dto = new SchedulePageItemResponseTeachingAssignmentEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : SchedulePageItemResponseTeachingAssignmentEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class SchedulePageItemResponseTeachingAssignmentDto {
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

  @ApiPropertyOptional({
    type: () => SchedulePageItemResponseTeachingAssignmentSubjectDto,
  })
  subject?: SchedulePageItemResponseTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () => SchedulePageItemResponseTeachingAssignmentClassroomDto,
  })
  classroom?: SchedulePageItemResponseTeachingAssignmentClassroomDto

  @ApiPropertyOptional({
    type: () => SchedulePageItemResponseTeachingAssignmentEmployeeDto,
  })
  employee?: SchedulePageItemResponseTeachingAssignmentEmployeeDto

  static fromDomain(
    domain: NonNullable<ScheduleWithDetails['teachingAssignment']>,
  ): SchedulePageItemResponseTeachingAssignmentDto {
    const dto = new SchedulePageItemResponseTeachingAssignmentDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroomId = domain.classroomId
    dto.subjectId = domain.subjectId
    dto.semesterId = domain.semesterId
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : SchedulePageItemResponseTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : SchedulePageItemResponseTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : SchedulePageItemResponseTeachingAssignmentEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class SchedulePageItemResponseTimeSlotDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: Number })
  order!: number

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<ScheduleWithDetails['timeSlot']>,
  ): SchedulePageItemResponseTimeSlotDto {
    const dto = new SchedulePageItemResponseTimeSlotDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.order = domain.order
    dto.typeId = domain.typeId
    return dto
  }
}

export class SchedulePageItemResponseDto {
  @ApiPropertyOptional({
    type: () => SchedulePageItemResponseTeachingAssignmentDto,
  })
  teachingAssignment?: SchedulePageItemResponseTeachingAssignmentDto

  @ApiPropertyOptional({ type: () => SchedulePageItemResponseTimeSlotDto })
  timeSlot?: SchedulePageItemResponseTimeSlotDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  teachingAssignmentId!: string

  @ApiProperty({ type: String })
  timeSlotId!: string

  @ApiProperty({ type: String })
  day!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  static fromDomain(domain: ScheduleWithDetails): SchedulePageItemResponseDto {
    const dto = new SchedulePageItemResponseDto()
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : SchedulePageItemResponseTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    if (domain.timeSlot !== undefined)
      dto.timeSlot =
        domain.timeSlot == null
          ? domain.timeSlot
          : SchedulePageItemResponseTimeSlotDto.fromDomain(domain.timeSlot)
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.timeSlotId = domain.timeSlotId
    dto.day = domain.day
    dto.room = domain.room
    return dto
  }
}

export class SchedulePageResponseDto {
  @ApiProperty({ type: () => [SchedulePageItemResponseDto] })
  data!: SchedulePageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: ScheduleWithDetails[]
    total: number
    page: number
    limit: number
  }): SchedulePageResponseDto {
    const dto = new SchedulePageResponseDto()
    dto.data = domain.data.map((item) =>
      SchedulePageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyScheduleResult['classroom']>[number]
        >['teachingAssignment']
      >['subject']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentSubjectDto {
    const dto = new MyScheduleResponseClassroomTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentClassroomGradeDto {
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
          NonNullable<
            NonNullable<MyScheduleResult['classroom']>[number]
          >['teachingAssignment']
        >['classroom']
      >['grade']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentClassroomGradeDto {
    const dto =
      new MyScheduleResponseClassroomTeachingAssignmentClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentClassroomDto {
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
    type: () => MyScheduleResponseClassroomTeachingAssignmentClassroomGradeDto,
  })
  grade?: MyScheduleResponseClassroomTeachingAssignmentClassroomGradeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyScheduleResult['classroom']>[number]
        >['teachingAssignment']
      >['classroom']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentClassroomDto {
    const dto = new MyScheduleResponseClassroomTeachingAssignmentClassroomDto()
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
          : MyScheduleResponseClassroomTeachingAssignmentClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              NonNullable<MyScheduleResult['classroom']>[number]
            >['teachingAssignment']
          >['employee']
        >['user']
      >['profile']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentEmployeeUserProfileDto {
    const dto =
      new MyScheduleResponseClassroomTeachingAssignmentEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      MyScheduleResponseClassroomTeachingAssignmentEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: MyScheduleResponseClassroomTeachingAssignmentEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<MyScheduleResult['classroom']>[number]
          >['teachingAssignment']
        >['employee']
      >['user']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentEmployeeUserDto {
    const dto =
      new MyScheduleResponseClassroomTeachingAssignmentEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyScheduleResponseClassroomTeachingAssignmentEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => MyScheduleResponseClassroomTeachingAssignmentEmployeeUserDto,
  })
  user?: MyScheduleResponseClassroomTeachingAssignmentEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyScheduleResult['classroom']>[number]
        >['teachingAssignment']
      >['employee']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentEmployeeDto {
    const dto = new MyScheduleResponseClassroomTeachingAssignmentEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyScheduleResponseClassroomTeachingAssignmentEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class MyScheduleResponseClassroomTeachingAssignmentDto {
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

  @ApiPropertyOptional({
    type: () => MyScheduleResponseClassroomTeachingAssignmentSubjectDto,
  })
  subject?: MyScheduleResponseClassroomTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () => MyScheduleResponseClassroomTeachingAssignmentClassroomDto,
  })
  classroom?: MyScheduleResponseClassroomTeachingAssignmentClassroomDto

  @ApiPropertyOptional({
    type: () => MyScheduleResponseClassroomTeachingAssignmentEmployeeDto,
  })
  employee?: MyScheduleResponseClassroomTeachingAssignmentEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyScheduleResult['classroom']>[number]
      >['teachingAssignment']
    >,
  ): MyScheduleResponseClassroomTeachingAssignmentDto {
    const dto = new MyScheduleResponseClassroomTeachingAssignmentDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroomId = domain.classroomId
    dto.subjectId = domain.subjectId
    dto.semesterId = domain.semesterId
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : MyScheduleResponseClassroomTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : MyScheduleResponseClassroomTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : MyScheduleResponseClassroomTeachingAssignmentEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class MyScheduleResponseClassroomTimeSlotDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: Number })
  order!: number

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyScheduleResult['classroom']>[number]
      >['timeSlot']
    >,
  ): MyScheduleResponseClassroomTimeSlotDto {
    const dto = new MyScheduleResponseClassroomTimeSlotDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.order = domain.order
    dto.typeId = domain.typeId
    return dto
  }
}

export class MyScheduleResponseClassroomDto {
  @ApiPropertyOptional({
    type: () => MyScheduleResponseClassroomTeachingAssignmentDto,
  })
  teachingAssignment?: MyScheduleResponseClassroomTeachingAssignmentDto

  @ApiPropertyOptional({ type: () => MyScheduleResponseClassroomTimeSlotDto })
  timeSlot?: MyScheduleResponseClassroomTimeSlotDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  teachingAssignmentId!: string

  @ApiProperty({ type: String })
  timeSlotId!: string

  @ApiProperty({ type: String })
  day!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<MyScheduleResult['classroom']>[number]>,
  ): MyScheduleResponseClassroomDto {
    const dto = new MyScheduleResponseClassroomDto()
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : MyScheduleResponseClassroomTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    if (domain.timeSlot !== undefined)
      dto.timeSlot =
        domain.timeSlot == null
          ? domain.timeSlot
          : MyScheduleResponseClassroomTimeSlotDto.fromDomain(domain.timeSlot)
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.timeSlotId = domain.timeSlotId
    dto.day = domain.day
    dto.room = domain.room
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyScheduleResult['teaching']>[number]
        >['teachingAssignment']
      >['subject']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentSubjectDto {
    const dto = new MyScheduleResponseTeachingTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentClassroomGradeDto {
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
          NonNullable<
            NonNullable<MyScheduleResult['teaching']>[number]
          >['teachingAssignment']
        >['classroom']
      >['grade']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentClassroomGradeDto {
    const dto =
      new MyScheduleResponseTeachingTeachingAssignmentClassroomGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentClassroomDto {
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
    type: () => MyScheduleResponseTeachingTeachingAssignmentClassroomGradeDto,
  })
  grade?: MyScheduleResponseTeachingTeachingAssignmentClassroomGradeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyScheduleResult['teaching']>[number]
        >['teachingAssignment']
      >['classroom']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentClassroomDto {
    const dto = new MyScheduleResponseTeachingTeachingAssignmentClassroomDto()
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
          : MyScheduleResponseTeachingTeachingAssignmentClassroomGradeDto.fromDomain(
              domain.grade,
            )
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentEmployeeUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<
              NonNullable<MyScheduleResult['teaching']>[number]
            >['teachingAssignment']
          >['employee']
        >['user']
      >['profile']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentEmployeeUserProfileDto {
    const dto =
      new MyScheduleResponseTeachingTeachingAssignmentEmployeeUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentEmployeeUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () =>
      MyScheduleResponseTeachingTeachingAssignmentEmployeeUserProfileDto,
    nullable: true,
  })
  profile?: MyScheduleResponseTeachingTeachingAssignmentEmployeeUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<MyScheduleResult['teaching']>[number]
          >['teachingAssignment']
        >['employee']
      >['user']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentEmployeeUserDto {
    const dto =
      new MyScheduleResponseTeachingTeachingAssignmentEmployeeUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : MyScheduleResponseTeachingTeachingAssignmentEmployeeUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentEmployeeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  nip!: string | null

  @ApiPropertyOptional({
    type: () => MyScheduleResponseTeachingTeachingAssignmentEmployeeUserDto,
  })
  user?: MyScheduleResponseTeachingTeachingAssignmentEmployeeUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<MyScheduleResult['teaching']>[number]
        >['teachingAssignment']
      >['employee']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentEmployeeDto {
    const dto = new MyScheduleResponseTeachingTeachingAssignmentEmployeeDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.nip = domain.nip
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : MyScheduleResponseTeachingTeachingAssignmentEmployeeUserDto.fromDomain(
              domain.user,
            )
    return dto
  }
}

export class MyScheduleResponseTeachingTeachingAssignmentDto {
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

  @ApiPropertyOptional({
    type: () => MyScheduleResponseTeachingTeachingAssignmentSubjectDto,
  })
  subject?: MyScheduleResponseTeachingTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () => MyScheduleResponseTeachingTeachingAssignmentClassroomDto,
  })
  classroom?: MyScheduleResponseTeachingTeachingAssignmentClassroomDto

  @ApiPropertyOptional({
    type: () => MyScheduleResponseTeachingTeachingAssignmentEmployeeDto,
  })
  employee?: MyScheduleResponseTeachingTeachingAssignmentEmployeeDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<MyScheduleResult['teaching']>[number]
      >['teachingAssignment']
    >,
  ): MyScheduleResponseTeachingTeachingAssignmentDto {
    const dto = new MyScheduleResponseTeachingTeachingAssignmentDto()
    dto.id = domain.id
    dto.employeeId = domain.employeeId
    dto.classroomId = domain.classroomId
    dto.subjectId = domain.subjectId
    dto.semesterId = domain.semesterId
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : MyScheduleResponseTeachingTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : MyScheduleResponseTeachingTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    if (domain.employee !== undefined)
      dto.employee =
        domain.employee == null
          ? domain.employee
          : MyScheduleResponseTeachingTeachingAssignmentEmployeeDto.fromDomain(
              domain.employee,
            )
    return dto
  }
}

export class MyScheduleResponseTeachingTimeSlotDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: Number })
  order!: number

  @ApiProperty({ type: String })
  typeId!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<MyScheduleResult['teaching']>[number]>['timeSlot']
    >,
  ): MyScheduleResponseTeachingTimeSlotDto {
    const dto = new MyScheduleResponseTeachingTimeSlotDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.startTime = domain.startTime.toISOString()
    dto.endTime = domain.endTime.toISOString()
    dto.order = domain.order
    dto.typeId = domain.typeId
    return dto
  }
}

export class MyScheduleResponseTeachingDto {
  @ApiPropertyOptional({
    type: () => MyScheduleResponseTeachingTeachingAssignmentDto,
  })
  teachingAssignment?: MyScheduleResponseTeachingTeachingAssignmentDto

  @ApiPropertyOptional({ type: () => MyScheduleResponseTeachingTimeSlotDto })
  timeSlot?: MyScheduleResponseTeachingTimeSlotDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  teachingAssignmentId!: string

  @ApiProperty({ type: String })
  timeSlotId!: string

  @ApiProperty({ type: String })
  day!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<MyScheduleResult['teaching']>[number]>,
  ): MyScheduleResponseTeachingDto {
    const dto = new MyScheduleResponseTeachingDto()
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : MyScheduleResponseTeachingTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    if (domain.timeSlot !== undefined)
      dto.timeSlot =
        domain.timeSlot == null
          ? domain.timeSlot
          : MyScheduleResponseTeachingTimeSlotDto.fromDomain(domain.timeSlot)
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.timeSlotId = domain.timeSlotId
    dto.day = domain.day
    dto.room = domain.room
    return dto
  }
}

export class MyScheduleResponseDto {
  @ApiProperty({ type: () => MyScheduleResponseClassroomDto, isArray: true })
  classroom!: MyScheduleResponseClassroomDto[]

  @ApiProperty({ type: () => MyScheduleResponseTeachingDto, isArray: true })
  teaching!: MyScheduleResponseTeachingDto[]

  static fromDomain(domain: MyScheduleResult): MyScheduleResponseDto {
    const dto = new MyScheduleResponseDto()
    dto.classroom = domain.classroom.map((x) =>
      MyScheduleResponseClassroomDto.fromDomain(x),
    )
    dto.teaching = domain.teaching.map((x) =>
      MyScheduleResponseTeachingDto.fromDomain(x),
    )
    return dto
  }
}

export class ScheduleBatchResultResponseDto {
  @ApiProperty({ type: Number })
  created!: number

  @ApiProperty({
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  })
  day!: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'

  static fromDomain(
    domain: Awaited<ReturnType<BatchUpsertScheduleUseCase['execute']>>,
  ): ScheduleBatchResultResponseDto {
    const dto = new ScheduleBatchResultResponseDto()
    dto.created = domain.created
    dto.day = domain.day
    return dto
  }
}

export class TimeSlotItemResponseTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isLesson!: boolean

  @ApiProperty({ type: String, isArray: true })
  days!: string[]

  @ApiProperty({ type: Number })
  defaultDurationMinutes!: number

  static fromDomain(
    domain: NonNullable<TimeSlotWithType['type']>,
  ): TimeSlotItemResponseTypeDto {
    const dto = new TimeSlotItemResponseTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isLesson = domain.isLesson
    dto.days = [...domain.days]
    dto.defaultDurationMinutes = domain.defaultDurationMinutes
    return dto
  }
}

export class TimeSlotItemResponseDto {
  @ApiPropertyOptional({ type: () => TimeSlotItemResponseTypeDto })
  type?: TimeSlotItemResponseTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: Number })
  order!: number

  static fromDomain(domain: TimeSlotWithType): TimeSlotItemResponseDto {
    const dto = new TimeSlotItemResponseDto()
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : TimeSlotItemResponseTypeDto.fromDomain(domain.type)
    dto.id = domain.id
    dto.typeId = domain.typeId
    dto.name = domain.name
    dto.startTime =
      domain.startTime instanceof Date
        ? domain.startTime.toISOString()
        : domain.startTime
    dto.endTime =
      domain.endTime instanceof Date
        ? domain.endTime.toISOString()
        : domain.endTime
    dto.order = domain.order
    return dto
  }
}

export class TimeSlotPageItemResponseTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isLesson!: boolean

  @ApiProperty({ type: String, isArray: true })
  days!: string[]

  @ApiProperty({ type: Number })
  defaultDurationMinutes!: number

  static fromDomain(
    domain: NonNullable<TimeSlotWithType['type']>,
  ): TimeSlotPageItemResponseTypeDto {
    const dto = new TimeSlotPageItemResponseTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isLesson = domain.isLesson
    dto.days = [...domain.days]
    dto.defaultDurationMinutes = domain.defaultDurationMinutes
    return dto
  }
}

export class TimeSlotPageItemResponseDto {
  @ApiPropertyOptional({ type: () => TimeSlotPageItemResponseTypeDto })
  type?: TimeSlotPageItemResponseTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startTime!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endTime!: string

  @ApiProperty({ type: Number })
  order!: number

  static fromDomain(domain: TimeSlotWithType): TimeSlotPageItemResponseDto {
    const dto = new TimeSlotPageItemResponseDto()
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : TimeSlotPageItemResponseTypeDto.fromDomain(domain.type)
    dto.id = domain.id
    dto.typeId = domain.typeId
    dto.name = domain.name
    dto.startTime =
      domain.startTime instanceof Date
        ? domain.startTime.toISOString()
        : domain.startTime
    dto.endTime =
      domain.endTime instanceof Date
        ? domain.endTime.toISOString()
        : domain.endTime
    dto.order = domain.order
    return dto
  }
}

export class TimeSlotPageResponseDto {
  @ApiProperty({ type: () => [TimeSlotPageItemResponseDto] })
  data!: TimeSlotPageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: TimeSlotWithType[]
    total: number
    page: number
    limit: number
  }): TimeSlotPageResponseDto {
    const dto = new TimeSlotPageResponseDto()
    dto.data = domain.data.map((item) =>
      TimeSlotPageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class TimeSlotTypeItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isLesson!: boolean

  @ApiProperty({ type: String, isArray: true })
  days!: string[]

  @ApiProperty({ type: Number })
  defaultDurationMinutes!: number

  static fromDomain(domain: TimeSlotTypeEntity): TimeSlotTypeItemResponseDto {
    const dto = new TimeSlotTypeItemResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isLesson = domain.isLesson
    dto.days = [...domain.days]
    dto.defaultDurationMinutes = domain.defaultDurationMinutes
    return dto
  }
}
