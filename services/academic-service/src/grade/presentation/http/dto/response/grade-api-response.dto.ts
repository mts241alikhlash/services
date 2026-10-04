import type { GradeAcademicYearWithDetails } from '../../../../domain/entities/grade-academic-year.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GradeEntity } from '../../../../domain/entities/grade.entity.js'

export class GradeItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(domain: GradeEntity): GradeItemResponseDto {
    const dto = new GradeItemResponseDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class GradePageItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(domain: GradeEntity): GradePageItemResponseDto {
    const dto = new GradePageItemResponseDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class GradePageResponseDto {
  @ApiProperty({ type: () => [GradePageItemResponseDto] })
  data!: GradePageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: GradeEntity[]
    total: number
    page: number
    limit: number
  }): GradePageResponseDto {
    const dto = new GradePageResponseDto()
    dto.data = domain.data.map((item) =>
      GradePageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class GradeAcademicYearItemResponseGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: NonNullable<GradeAcademicYearWithDetails['grade']>,
  ): GradeAcademicYearItemResponseGradeDto {
    const dto = new GradeAcademicYearItemResponseGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class GradeAcademicYearItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<GradeAcademicYearWithDetails['academicYear']>,
  ): GradeAcademicYearItemResponseAcademicYearDto {
    const dto = new GradeAcademicYearItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class GradeAcademicYearItemResponseCurriculaDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<GradeAcademicYearWithDetails['curricula']>,
  ): GradeAcademicYearItemResponseCurriculaDto {
    const dto = new GradeAcademicYearItemResponseCurriculaDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class GradeAcademicYearItemResponseDto {
  @ApiPropertyOptional({ type: () => GradeAcademicYearItemResponseGradeDto })
  grade?: GradeAcademicYearItemResponseGradeDto

  @ApiPropertyOptional({
    type: () => GradeAcademicYearItemResponseAcademicYearDto,
  })
  academicYear?: GradeAcademicYearItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => GradeAcademicYearItemResponseCurriculaDto,
  })
  curricula?: GradeAcademicYearItemResponseCurriculaDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiPropertyOptional({ type: String })
  curriculaId?: string

  @ApiPropertyOptional({ type: String })
  curriculumId?: string

  static fromDomain(
    domain: GradeAcademicYearWithDetails,
  ): GradeAcademicYearItemResponseDto {
    const dto = new GradeAcademicYearItemResponseDto()
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : GradeAcademicYearItemResponseGradeDto.fromDomain(domain.grade)
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : GradeAcademicYearItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.curricula !== undefined)
      dto.curricula =
        domain.curricula == null
          ? domain.curricula
          : GradeAcademicYearItemResponseCurriculaDto.fromDomain(
              domain.curricula,
            )
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.curriculaId = domain.curriculaId
    dto.curriculumId = domain.curriculumId
    return dto
  }
}

export class GradeAcademicYearPageItemResponseGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: NonNullable<GradeAcademicYearWithDetails['grade']>,
  ): GradeAcademicYearPageItemResponseGradeDto {
    const dto = new GradeAcademicYearPageItemResponseGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class GradeAcademicYearPageItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<GradeAcademicYearWithDetails['academicYear']>,
  ): GradeAcademicYearPageItemResponseAcademicYearDto {
    const dto = new GradeAcademicYearPageItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class GradeAcademicYearPageItemResponseCurriculaDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<GradeAcademicYearWithDetails['curricula']>,
  ): GradeAcademicYearPageItemResponseCurriculaDto {
    const dto = new GradeAcademicYearPageItemResponseCurriculaDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class GradeAcademicYearPageItemResponseDto {
  @ApiPropertyOptional({
    type: () => GradeAcademicYearPageItemResponseGradeDto,
  })
  grade?: GradeAcademicYearPageItemResponseGradeDto

  @ApiPropertyOptional({
    type: () => GradeAcademicYearPageItemResponseAcademicYearDto,
  })
  academicYear?: GradeAcademicYearPageItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => GradeAcademicYearPageItemResponseCurriculaDto,
  })
  curricula?: GradeAcademicYearPageItemResponseCurriculaDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  gradeId!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiPropertyOptional({ type: String })
  curriculaId?: string

  @ApiPropertyOptional({ type: String })
  curriculumId?: string

  static fromDomain(
    domain: GradeAcademicYearWithDetails,
  ): GradeAcademicYearPageItemResponseDto {
    const dto = new GradeAcademicYearPageItemResponseDto()
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : GradeAcademicYearPageItemResponseGradeDto.fromDomain(domain.grade)
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : GradeAcademicYearPageItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.curricula !== undefined)
      dto.curricula =
        domain.curricula == null
          ? domain.curricula
          : GradeAcademicYearPageItemResponseCurriculaDto.fromDomain(
              domain.curricula,
            )
    dto.id = domain.id
    dto.gradeId = domain.gradeId
    dto.academicYearId = domain.academicYearId
    dto.curriculaId = domain.curriculaId
    dto.curriculumId = domain.curriculumId
    return dto
  }
}

export class GradeAcademicYearPageResponseDto {
  @ApiProperty({ type: () => [GradeAcademicYearPageItemResponseDto] })
  data!: GradeAcademicYearPageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: GradeAcademicYearWithDetails[]
    total: number
    page: number
    limit: number
  }): GradeAcademicYearPageResponseDto {
    const dto = new GradeAcademicYearPageResponseDto()
    dto.data = domain.data.map((item) =>
      GradeAcademicYearPageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
