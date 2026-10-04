import type { GetAdmissionWavesUseCase } from '../../../../application/use-cases/get-admission-waves/get-admission-waves.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetAdmissionWaveByIdUseCase } from '../../../../application/use-cases/get-admission-wave-by-id/get-admission-wave-by-id.use-case.js'

export class AdmissionWaveResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetAdmissionWaveByIdUseCase['execute']>
      >['academicYear']
    >,
  ): AdmissionWaveResponseAcademicYearDto {
    const dto = new AdmissionWaveResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionWaveResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  applications?: number

  static fromDomain(
    domain: NonNullable<
      Awaited<ReturnType<GetAdmissionWaveByIdUseCase['execute']>>['_count']
    >,
  ): AdmissionWaveResponseCountDto {
    const dto = new AdmissionWaveResponseCountDto()
    dto.applications = domain.applications
    return dto
  }
}

export class AdmissionWaveResponseDto {
  @ApiProperty({
    type: () => AdmissionWaveResponseAcademicYearDto,
    nullable: true,
  })
  academicYear!: AdmissionWaveResponseAcademicYearDto | null

  @ApiPropertyOptional({ type: () => AdmissionWaveResponseCountDto })
  _count?: AdmissionWaveResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: Awaited<ReturnType<GetAdmissionWaveByIdUseCase['execute']>>,
  ): AdmissionWaveResponseDto {
    const dto = new AdmissionWaveResponseDto()
    dto.academicYear =
      domain.academicYear == null
        ? domain.academicYear
        : AdmissionWaveResponseAcademicYearDto.fromDomain(domain.academicYear)
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : AdmissionWaveResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionWaveSummaryResponseAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetAdmissionWavesUseCase['execute']>
      >['data'][number]['academicYear']
    >,
  ): AdmissionWaveSummaryResponseAcademicYearDto {
    const dto = new AdmissionWaveSummaryResponseAcademicYearDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class AdmissionWaveSummaryResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  applications?: number

  static fromDomain(
    domain: NonNullable<
      Awaited<
        ReturnType<GetAdmissionWavesUseCase['execute']>
      >['data'][number]['_count']
    >,
  ): AdmissionWaveSummaryResponseCountDto {
    const dto = new AdmissionWaveSummaryResponseCountDto()
    dto.applications = domain.applications
    return dto
  }
}

export class AdmissionWaveSummaryResponseDto {
  @ApiProperty({
    type: () => AdmissionWaveSummaryResponseAcademicYearDto,
    nullable: true,
  })
  academicYear!: AdmissionWaveSummaryResponseAcademicYearDto | null

  @ApiPropertyOptional({ type: () => AdmissionWaveSummaryResponseCountDto })
  _count?: AdmissionWaveSummaryResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  academicYearId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  registrationFee!: number

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: Number })
  lastRegistrationSeq!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: Awaited<
      ReturnType<GetAdmissionWavesUseCase['execute']>
    >['data'][number],
  ): AdmissionWaveSummaryResponseDto {
    const dto = new AdmissionWaveSummaryResponseDto()
    dto.academicYear =
      domain.academicYear == null
        ? domain.academicYear
        : AdmissionWaveSummaryResponseAcademicYearDto.fromDomain(
            domain.academicYear,
          )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : AdmissionWaveSummaryResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.academicYearId = domain.academicYearId
    dto.code = domain.code
    dto.name = domain.name
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.quota = domain.quota
    dto.registrationFee = domain.registrationFee
    dto.description = domain.description
    dto.isActive = domain.isActive
    dto.lastRegistrationSeq = domain.lastRegistrationSeq
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionWaveListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetAdmissionWavesUseCase['execute']>>['meta'],
  ): AdmissionWaveListResponseMetaDto {
    const dto = new AdmissionWaveListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class AdmissionWaveListResponseDto {
  @ApiProperty({ type: () => [AdmissionWaveSummaryResponseDto] })
  data!: AdmissionWaveSummaryResponseDto[]

  @ApiProperty({ type: () => AdmissionWaveListResponseMetaDto })
  meta!: AdmissionWaveListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetAdmissionWavesUseCase['execute']>>,
  ): AdmissionWaveListResponseDto {
    const dto = new AdmissionWaveListResponseDto()
    dto.data = domain.data.map((item) =>
      AdmissionWaveSummaryResponseDto.fromDomain(item),
    )
    dto.meta = AdmissionWaveListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
