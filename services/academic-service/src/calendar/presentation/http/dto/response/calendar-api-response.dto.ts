import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CalendarWithDetails } from '../../../../domain/entities/academic-calendar.entity.js'

export class AcademicCalendarItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CalendarWithDetails['academicYear']>,
  ): AcademicCalendarItemResponseAcademicYearDto {
    const dto = new AcademicCalendarItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class AcademicCalendarItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<CalendarWithDetails['semester']>['academicYear']
    >,
  ): AcademicCalendarItemResponseSemesterAcademicYearDto {
    const dto = new AcademicCalendarItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class AcademicCalendarItemResponseSemesterDto {
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
    type: () => AcademicCalendarItemResponseSemesterAcademicYearDto,
  })
  academicYear?: AcademicCalendarItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<CalendarWithDetails['semester']>,
  ): AcademicCalendarItemResponseSemesterDto {
    const dto = new AcademicCalendarItemResponseSemesterDto()
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
          : AcademicCalendarItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class AcademicCalendarItemResponseTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<CalendarWithDetails['type']>,
  ): AcademicCalendarItemResponseTypeDto {
    const dto = new AcademicCalendarItemResponseTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AcademicCalendarItemResponseDto {
  @ApiPropertyOptional({
    type: () => AcademicCalendarItemResponseAcademicYearDto,
  })
  academicYear?: AcademicCalendarItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => AcademicCalendarItemResponseSemesterDto,
    nullable: true,
  })
  semester?: AcademicCalendarItemResponseSemesterDto | null

  @ApiPropertyOptional({ type: () => AcademicCalendarItemResponseTypeDto })
  type?: AcademicCalendarItemResponseTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  semesterId?: string | null

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startTime?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endTime?: string | null

  static fromDomain(
    domain: CalendarWithDetails,
  ): AcademicCalendarItemResponseDto {
    const dto = new AcademicCalendarItemResponseDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : AcademicCalendarItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : AcademicCalendarItemResponseSemesterDto.fromDomain(domain.semester)
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : AcademicCalendarItemResponseTypeDto.fromDomain(domain.type)
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.semesterId = domain.semesterId
    dto.title = domain.title
    dto.typeId = domain.typeId
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.description = domain.description
    if (domain.startTime !== undefined)
      dto.startTime =
        domain.startTime == null
          ? domain.startTime
          : domain.startTime.toISOString()
    if (domain.endTime !== undefined)
      dto.endTime =
        domain.endTime == null ? domain.endTime : domain.endTime.toISOString()
    return dto
  }
}

export class AcademicCalendarPageItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CalendarWithDetails['academicYear']>,
  ): AcademicCalendarPageItemResponseAcademicYearDto {
    const dto = new AcademicCalendarPageItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class AcademicCalendarPageItemResponseSemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<CalendarWithDetails['semester']>['academicYear']
    >,
  ): AcademicCalendarPageItemResponseSemesterAcademicYearDto {
    const dto = new AcademicCalendarPageItemResponseSemesterAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class AcademicCalendarPageItemResponseSemesterDto {
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
    type: () => AcademicCalendarPageItemResponseSemesterAcademicYearDto,
  })
  academicYear?: AcademicCalendarPageItemResponseSemesterAcademicYearDto

  static fromDomain(
    domain: NonNullable<CalendarWithDetails['semester']>,
  ): AcademicCalendarPageItemResponseSemesterDto {
    const dto = new AcademicCalendarPageItemResponseSemesterDto()
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
          : AcademicCalendarPageItemResponseSemesterAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    return dto
  }
}

export class AcademicCalendarPageItemResponseTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<CalendarWithDetails['type']>,
  ): AcademicCalendarPageItemResponseTypeDto {
    const dto = new AcademicCalendarPageItemResponseTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AcademicCalendarPageItemResponseDto {
  @ApiPropertyOptional({
    type: () => AcademicCalendarPageItemResponseAcademicYearDto,
  })
  academicYear?: AcademicCalendarPageItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => AcademicCalendarPageItemResponseSemesterDto,
    nullable: true,
  })
  semester?: AcademicCalendarPageItemResponseSemesterDto | null

  @ApiPropertyOptional({ type: () => AcademicCalendarPageItemResponseTypeDto })
  type?: AcademicCalendarPageItemResponseTypeDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  semesterId?: string | null

  @ApiProperty({ type: String })
  title!: string

  @ApiProperty({ type: String })
  typeId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startTime?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endTime?: string | null

  static fromDomain(
    domain: CalendarWithDetails,
  ): AcademicCalendarPageItemResponseDto {
    const dto = new AcademicCalendarPageItemResponseDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : AcademicCalendarPageItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.semester !== undefined)
      dto.semester =
        domain.semester == null
          ? domain.semester
          : AcademicCalendarPageItemResponseSemesterDto.fromDomain(
              domain.semester,
            )
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : AcademicCalendarPageItemResponseTypeDto.fromDomain(domain.type)
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.semesterId = domain.semesterId
    dto.title = domain.title
    dto.typeId = domain.typeId
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.description = domain.description
    if (domain.startTime !== undefined)
      dto.startTime =
        domain.startTime == null
          ? domain.startTime
          : domain.startTime.toISOString()
    if (domain.endTime !== undefined)
      dto.endTime =
        domain.endTime == null ? domain.endTime : domain.endTime.toISOString()
    return dto
  }
}

export class AcademicCalendarPageResponseDto {
  @ApiProperty({ type: () => [AcademicCalendarPageItemResponseDto] })
  data!: AcademicCalendarPageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: CalendarWithDetails[]
    total: number
    page: number
    limit: number
  }): AcademicCalendarPageResponseDto {
    const dto = new AcademicCalendarPageResponseDto()
    dto.data = domain.data.map((item) =>
      AcademicCalendarPageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
