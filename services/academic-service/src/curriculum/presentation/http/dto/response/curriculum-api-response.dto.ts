import type { BulkCreateResult } from '../../../../application/use-cases/bulk-create-curriculum-subjects/bulk-create-curriculum-subjects.use-case.js'
import type { CurriculumSubjectWithDetails } from '../../../../domain/entities/curriculum-subject.entity.js'
import type { GetCurriculaUseCase } from '../../../../application/use-cases/get-curricula/get-curricula.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { CurriculumWithDetails } from '../../../../domain/entities/curriculum.entity.js'

export class CurriculumItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CurriculumWithDetails['academicYear']>,
  ): CurriculumItemResponseAcademicYearDto {
    const dto = new CurriculumItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumItemResponseCurriculumSubjectsCurriculumDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
      >['curriculum']
    >,
  ): CurriculumItemResponseCurriculumSubjectsCurriculumDto {
    const dto = new CurriculumItemResponseCurriculumSubjectsCurriculumDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumItemResponseCurriculumSubjectsSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
      >['subject']
    >,
  ): CurriculumItemResponseCurriculumSubjectsSubjectDto {
    const dto = new CurriculumItemResponseCurriculumSubjectsSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class CurriculumItemResponseCurriculumSubjectsGradeDto {
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
        NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
      >['grade']
    >,
  ): CurriculumItemResponseCurriculumSubjectsGradeDto {
    const dto = new CurriculumItemResponseCurriculumSubjectsGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumItemResponseCurriculumSubjectsDto {
  @ApiPropertyOptional({
    type: () => CurriculumItemResponseCurriculumSubjectsCurriculumDto,
  })
  curriculum?: CurriculumItemResponseCurriculumSubjectsCurriculumDto

  @ApiPropertyOptional({
    type: () => CurriculumItemResponseCurriculumSubjectsSubjectDto,
  })
  subject?: CurriculumItemResponseCurriculumSubjectsSubjectDto

  @ApiPropertyOptional({
    type: () => CurriculumItemResponseCurriculumSubjectsGradeDto,
    nullable: true,
  })
  grade?: CurriculumItemResponseCurriculumSubjectsGradeDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  curriculaId?: string

  @ApiPropertyOptional({ type: String })
  curriculumId?: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiPropertyOptional({ type: String })
  gradeId?: string

  @ApiPropertyOptional({ type: Number })
  weeklyHours?: number

  @ApiPropertyOptional({ type: Number })
  hoursPerWeek?: number

  @ApiPropertyOptional({ type: Number })
  passingScore?: number

  static fromDomain(
    domain: NonNullable<
      NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
    >,
  ): CurriculumItemResponseCurriculumSubjectsDto {
    const dto = new CurriculumItemResponseCurriculumSubjectsDto()
    if (domain.curriculum !== undefined)
      dto.curriculum =
        domain.curriculum == null
          ? domain.curriculum
          : CurriculumItemResponseCurriculumSubjectsCurriculumDto.fromDomain(
              domain.curriculum,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : CurriculumItemResponseCurriculumSubjectsSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : CurriculumItemResponseCurriculumSubjectsGradeDto.fromDomain(
              domain.grade,
            )
    dto.id = domain.id
    dto.curriculaId = domain.curriculaId
    dto.curriculumId = domain.curriculumId
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.weeklyHours = domain.weeklyHours
    dto.hoursPerWeek = domain.hoursPerWeek
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class CurriculumItemResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  gradeAcademicYears?: number

  static fromDomain(
    domain: NonNullable<CurriculumWithDetails['_count']>,
  ): CurriculumItemResponseCountDto {
    const dto = new CurriculumItemResponseCountDto()
    dto.gradeAcademicYears = domain.gradeAcademicYears
    return dto
  }
}

export class CurriculumItemResponseDto {
  @ApiPropertyOptional({ type: () => CurriculumItemResponseAcademicYearDto })
  academicYear?: CurriculumItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => CurriculumItemResponseCurriculumSubjectsDto,
    isArray: true,
  })
  curriculumSubjects?: CurriculumItemResponseCurriculumSubjectsDto[]

  @ApiPropertyOptional({ type: () => CurriculumItemResponseCountDto })
  _count?: CurriculumItemResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: CurriculumWithDetails): CurriculumItemResponseDto {
    const dto = new CurriculumItemResponseDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : CurriculumItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.curriculumSubjects !== undefined)
      dto.curriculumSubjects =
        domain.curriculumSubjects == null
          ? domain.curriculumSubjects
          : domain.curriculumSubjects.map((x) =>
              CurriculumItemResponseCurriculumSubjectsDto.fromDomain(x),
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : CurriculumItemResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumPageItemResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CurriculumWithDetails['academicYear']>,
  ): CurriculumPageItemResponseAcademicYearDto {
    const dto = new CurriculumPageItemResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumPageItemResponseCurriculumSubjectsCurriculumDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
      >['curriculum']
    >,
  ): CurriculumPageItemResponseCurriculumSubjectsCurriculumDto {
    const dto = new CurriculumPageItemResponseCurriculumSubjectsCurriculumDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumPageItemResponseCurriculumSubjectsSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
      >['subject']
    >,
  ): CurriculumPageItemResponseCurriculumSubjectsSubjectDto {
    const dto = new CurriculumPageItemResponseCurriculumSubjectsSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class CurriculumPageItemResponseCurriculumSubjectsGradeDto {
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
        NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
      >['grade']
    >,
  ): CurriculumPageItemResponseCurriculumSubjectsGradeDto {
    const dto = new CurriculumPageItemResponseCurriculumSubjectsGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumPageItemResponseCurriculumSubjectsDto {
  @ApiPropertyOptional({
    type: () => CurriculumPageItemResponseCurriculumSubjectsCurriculumDto,
  })
  curriculum?: CurriculumPageItemResponseCurriculumSubjectsCurriculumDto

  @ApiPropertyOptional({
    type: () => CurriculumPageItemResponseCurriculumSubjectsSubjectDto,
  })
  subject?: CurriculumPageItemResponseCurriculumSubjectsSubjectDto

  @ApiPropertyOptional({
    type: () => CurriculumPageItemResponseCurriculumSubjectsGradeDto,
    nullable: true,
  })
  grade?: CurriculumPageItemResponseCurriculumSubjectsGradeDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  curriculaId?: string

  @ApiPropertyOptional({ type: String })
  curriculumId?: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiPropertyOptional({ type: String })
  gradeId?: string

  @ApiPropertyOptional({ type: Number })
  weeklyHours?: number

  @ApiPropertyOptional({ type: Number })
  hoursPerWeek?: number

  @ApiPropertyOptional({ type: Number })
  passingScore?: number

  static fromDomain(
    domain: NonNullable<
      NonNullable<CurriculumWithDetails['curriculumSubjects']>[number]
    >,
  ): CurriculumPageItemResponseCurriculumSubjectsDto {
    const dto = new CurriculumPageItemResponseCurriculumSubjectsDto()
    if (domain.curriculum !== undefined)
      dto.curriculum =
        domain.curriculum == null
          ? domain.curriculum
          : CurriculumPageItemResponseCurriculumSubjectsCurriculumDto.fromDomain(
              domain.curriculum,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : CurriculumPageItemResponseCurriculumSubjectsSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : CurriculumPageItemResponseCurriculumSubjectsGradeDto.fromDomain(
              domain.grade,
            )
    dto.id = domain.id
    dto.curriculaId = domain.curriculaId
    dto.curriculumId = domain.curriculumId
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.weeklyHours = domain.weeklyHours
    dto.hoursPerWeek = domain.hoursPerWeek
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class CurriculumPageItemResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  gradeAcademicYears?: number

  static fromDomain(
    domain: NonNullable<CurriculumWithDetails['_count']>,
  ): CurriculumPageItemResponseCountDto {
    const dto = new CurriculumPageItemResponseCountDto()
    dto.gradeAcademicYears = domain.gradeAcademicYears
    return dto
  }
}

export class CurriculumPageItemResponseDto {
  @ApiPropertyOptional({
    type: () => CurriculumPageItemResponseAcademicYearDto,
  })
  academicYear?: CurriculumPageItemResponseAcademicYearDto

  @ApiPropertyOptional({
    type: () => CurriculumPageItemResponseCurriculumSubjectsDto,
    isArray: true,
  })
  curriculumSubjects?: CurriculumPageItemResponseCurriculumSubjectsDto[]

  @ApiPropertyOptional({ type: () => CurriculumPageItemResponseCountDto })
  _count?: CurriculumPageItemResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: CurriculumWithDetails,
  ): CurriculumPageItemResponseDto {
    const dto = new CurriculumPageItemResponseDto()
    if (domain.academicYear !== undefined)
      dto.academicYear =
        domain.academicYear == null
          ? domain.academicYear
          : CurriculumPageItemResponseAcademicYearDto.fromDomain(
              domain.academicYear,
            )
    if (domain.curriculumSubjects !== undefined)
      dto.curriculumSubjects =
        domain.curriculumSubjects == null
          ? domain.curriculumSubjects
          : domain.curriculumSubjects.map((x) =>
              CurriculumPageItemResponseCurriculumSubjectsDto.fromDomain(x),
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : CurriculumPageItemResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumPageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetCurriculaUseCase['execute']>>['meta'],
  ): CurriculumPageResponseMetaDto {
    const dto = new CurriculumPageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class CurriculumPageResponseDto {
  @ApiProperty({ type: () => [CurriculumPageItemResponseDto] })
  data!: CurriculumPageItemResponseDto[]

  @ApiProperty({ type: () => CurriculumPageResponseMetaDto })
  meta!: CurriculumPageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetCurriculaUseCase['execute']>>,
  ): CurriculumPageResponseDto {
    const dto = new CurriculumPageResponseDto()
    dto.data = domain.data.map((item) =>
      CurriculumPageItemResponseDto.fromDomain(item),
    )
    dto.meta = CurriculumPageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class CurriculumSubjectItemResponseCurriculumDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CurriculumSubjectWithDetails['curriculum']>,
  ): CurriculumSubjectItemResponseCurriculumDto {
    const dto = new CurriculumSubjectItemResponseCurriculumDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumSubjectItemResponseSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<CurriculumSubjectWithDetails['subject']>,
  ): CurriculumSubjectItemResponseSubjectDto {
    const dto = new CurriculumSubjectItemResponseSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class CurriculumSubjectItemResponseGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CurriculumSubjectWithDetails['grade']>,
  ): CurriculumSubjectItemResponseGradeDto {
    const dto = new CurriculumSubjectItemResponseGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumSubjectItemResponseDto {
  @ApiPropertyOptional({
    type: () => CurriculumSubjectItemResponseCurriculumDto,
  })
  curriculum?: CurriculumSubjectItemResponseCurriculumDto

  @ApiPropertyOptional({ type: () => CurriculumSubjectItemResponseSubjectDto })
  subject?: CurriculumSubjectItemResponseSubjectDto

  @ApiPropertyOptional({
    type: () => CurriculumSubjectItemResponseGradeDto,
    nullable: true,
  })
  grade?: CurriculumSubjectItemResponseGradeDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  curriculaId?: string

  @ApiPropertyOptional({ type: String })
  curriculumId?: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiPropertyOptional({ type: String })
  gradeId?: string

  @ApiPropertyOptional({ type: Number })
  weeklyHours?: number

  @ApiPropertyOptional({ type: Number })
  hoursPerWeek?: number

  @ApiPropertyOptional({ type: Number })
  passingScore?: number

  static fromDomain(
    domain: CurriculumSubjectWithDetails,
  ): CurriculumSubjectItemResponseDto {
    const dto = new CurriculumSubjectItemResponseDto()
    if (domain.curriculum !== undefined)
      dto.curriculum =
        domain.curriculum == null
          ? domain.curriculum
          : CurriculumSubjectItemResponseCurriculumDto.fromDomain(
              domain.curriculum,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : CurriculumSubjectItemResponseSubjectDto.fromDomain(domain.subject)
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : CurriculumSubjectItemResponseGradeDto.fromDomain(domain.grade)
    dto.id = domain.id
    dto.curriculaId = domain.curriculaId
    dto.curriculumId = domain.curriculumId
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.weeklyHours = domain.weeklyHours
    dto.hoursPerWeek = domain.hoursPerWeek
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class CurriculumSubjectPageItemResponseCurriculumDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CurriculumSubjectWithDetails['curriculum']>,
  ): CurriculumSubjectPageItemResponseCurriculumDto {
    const dto = new CurriculumSubjectPageItemResponseCurriculumDto()
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumSubjectPageItemResponseSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<CurriculumSubjectWithDetails['subject']>,
  ): CurriculumSubjectPageItemResponseSubjectDto {
    const dto = new CurriculumSubjectPageItemResponseSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class CurriculumSubjectPageItemResponseGradeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: NonNullable<CurriculumSubjectWithDetails['grade']>,
  ): CurriculumSubjectPageItemResponseGradeDto {
    const dto = new CurriculumSubjectPageItemResponseGradeDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class CurriculumSubjectPageItemResponseDto {
  @ApiPropertyOptional({
    type: () => CurriculumSubjectPageItemResponseCurriculumDto,
  })
  curriculum?: CurriculumSubjectPageItemResponseCurriculumDto

  @ApiPropertyOptional({
    type: () => CurriculumSubjectPageItemResponseSubjectDto,
  })
  subject?: CurriculumSubjectPageItemResponseSubjectDto

  @ApiPropertyOptional({
    type: () => CurriculumSubjectPageItemResponseGradeDto,
    nullable: true,
  })
  grade?: CurriculumSubjectPageItemResponseGradeDto | null

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String })
  curriculaId?: string

  @ApiPropertyOptional({ type: String })
  curriculumId?: string

  @ApiProperty({ type: String })
  subjectId!: string

  @ApiPropertyOptional({ type: String })
  gradeId?: string

  @ApiPropertyOptional({ type: Number })
  weeklyHours?: number

  @ApiPropertyOptional({ type: Number })
  hoursPerWeek?: number

  @ApiPropertyOptional({ type: Number })
  passingScore?: number

  static fromDomain(
    domain: CurriculumSubjectWithDetails,
  ): CurriculumSubjectPageItemResponseDto {
    const dto = new CurriculumSubjectPageItemResponseDto()
    if (domain.curriculum !== undefined)
      dto.curriculum =
        domain.curriculum == null
          ? domain.curriculum
          : CurriculumSubjectPageItemResponseCurriculumDto.fromDomain(
              domain.curriculum,
            )
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : CurriculumSubjectPageItemResponseSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.grade !== undefined)
      dto.grade =
        domain.grade == null
          ? domain.grade
          : CurriculumSubjectPageItemResponseGradeDto.fromDomain(domain.grade)
    dto.id = domain.id
    dto.curriculaId = domain.curriculaId
    dto.curriculumId = domain.curriculumId
    dto.subjectId = domain.subjectId
    dto.gradeId = domain.gradeId
    dto.weeklyHours = domain.weeklyHours
    dto.hoursPerWeek = domain.hoursPerWeek
    dto.passingScore = domain.passingScore
    return dto
  }
}

export class CurriculumSubjectPageResponseDto {
  @ApiProperty({ type: () => [CurriculumSubjectPageItemResponseDto] })
  data!: CurriculumSubjectPageItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: CurriculumSubjectWithDetails[]
    total: number
    page: number
    limit: number
  }): CurriculumSubjectPageResponseDto {
    const dto = new CurriculumSubjectPageResponseDto()
    dto.data = domain.data.map((item) =>
      CurriculumSubjectPageItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class CurriculumSubjectBulkResultResponseDto {
  @ApiProperty({ type: Number })
  created!: number

  @ApiProperty({ type: Number })
  skipped!: number

  static fromDomain(
    domain: BulkCreateResult,
  ): CurriculumSubjectBulkResultResponseDto {
    const dto = new CurriculumSubjectBulkResultResponseDto()
    dto.created = domain.created
    dto.skipped = domain.skipped
    return dto
  }
}
