import { ApiProperty } from '@nestjs/swagger'

export class AdmissionEnrollmentRowResponseDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ type: String }) registrationNumber!: string
  @ApiProperty({ type: String }) applicantName!: string
  @ApiProperty({ type: String }) waveName!: string
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ enum: ['ACCEPTED', 'ENROLLING', 'ENROLLED'] })
  status!: string
  @ApiProperty({ enum: ['NEW', 'TRANSFER'], nullable: true }) admissionType!:
    'NEW' | 'TRANSFER' | null
  @ApiProperty({ type: Number, nullable: true }) targetGradeLevel!:
    number | null
  @ApiProperty({ type: String, nullable: true }) nis!: string | null
  @ApiProperty({ type: String, nullable: true }) nisn!: string | null
  @ApiProperty({ type: String, nullable: true }) enrolledStudentId!:
    string | null

  static fromDomain(
    domain: AdmissionEnrollmentRowResponseDto,
  ): AdmissionEnrollmentRowResponseDto {
    return Object.assign(new AdmissionEnrollmentRowResponseDto(), domain)
  }
}

export class AdmissionEnrollmentCountsDto {
  @ApiProperty({ type: Number }) ready!: number
  @ApiProperty({ type: Number }) held!: number
  @ApiProperty({ type: Number }) done!: number
}

export class AdmissionEnrollmentYearDto {
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ type: String, nullable: true }) academicYearName!:
    string | null
  @ApiProperty({ type: Boolean }) locked!: boolean
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lockedAt!: string | null
}

export class AdmissionEnrollmentMetaDto {
  @ApiProperty({ type: Number }) page!: number
  @ApiProperty({ type: Number }) limit!: number
  @ApiProperty({ type: Number }) total!: number
  @ApiProperty({ type: Number }) totalPages!: number
  @ApiProperty({ type: () => AdmissionEnrollmentCountsDto })
  counts!: AdmissionEnrollmentCountsDto
  @ApiProperty({ type: () => [AdmissionEnrollmentYearDto] })
  years!: AdmissionEnrollmentYearDto[]
}

export class AdmissionEnrollmentQueueResponseDto {
  @ApiProperty({ type: () => [AdmissionEnrollmentRowResponseDto] })
  data!: AdmissionEnrollmentRowResponseDto[]

  @ApiProperty({ type: () => AdmissionEnrollmentMetaDto })
  meta!: AdmissionEnrollmentMetaDto

  static fromDomain(domain: {
    data: AdmissionEnrollmentRowResponseDto[]
    meta: Omit<AdmissionEnrollmentMetaDto, 'years'> & {
      years: (Omit<AdmissionEnrollmentYearDto, 'lockedAt'> & {
        lockedAt: Date | null
      })[]
    }
  }): AdmissionEnrollmentQueueResponseDto {
    const dto = new AdmissionEnrollmentQueueResponseDto()
    dto.data = domain.data.map((row) =>
      AdmissionEnrollmentRowResponseDto.fromDomain(row),
    )
    dto.meta = {
      ...domain.meta,
      years: domain.meta.years.map((year) => ({
        ...year,
        lockedAt: year.lockedAt?.toISOString() ?? null,
      })),
    }
    return dto
  }
}

export class AdmissionNisRowDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ type: String }) applicantName!: string
  @ApiProperty({ type: String }) registrationNumber!: string
  @ApiProperty({ type: Number }) gradeLevel!: number
  @ApiProperty({ type: String, nullable: true }) previous!: string | null
  @ApiProperty({ type: String }) nis!: string
  @ApiProperty({ type: Boolean }) changed!: boolean
}

export class AdmissionNisSkippedDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ type: String }) applicantName!: string
  @ApiProperty({ type: String }) registrationNumber!: string
  @ApiProperty({ type: String }) reason!: string
}

export class AdmissionNisPreviewResponseDto {
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ type: String }) academicYearName!: string
  @ApiProperty({ type: Boolean }) locked!: boolean
  @ApiProperty({ type: Number }) changes!: number
  @ApiProperty({ type: Number }) created!: number
  @ApiProperty({ type: () => [AdmissionNisRowDto] }) rows!: AdmissionNisRowDto[]
  @ApiProperty({ type: () => [AdmissionNisSkippedDto] })
  skipped!: AdmissionNisSkippedDto[]

  static fromDomain(
    domain: AdmissionNisPreviewResponseDto,
  ): AdmissionNisPreviewResponseDto {
    return Object.assign(new AdmissionNisPreviewResponseDto(), domain)
  }
}

export class AdmissionNisFailureDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ type: String }) reason!: string
}

export class AdmissionNisComposeResponseDto {
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ type: Number }) written!: number
  @ApiProperty({ type: Number }) created!: number
  @ApiProperty({ type: Number }) changed!: number
  @ApiProperty({ type: () => [AdmissionNisFailureDto] })
  failed!: AdmissionNisFailureDto[]

  static fromDomain(
    domain: AdmissionNisComposeResponseDto,
  ): AdmissionNisComposeResponseDto {
    return Object.assign(new AdmissionNisComposeResponseDto(), domain)
  }
}

export class AdmissionNisLockResponseDto {
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ type: String, format: 'date-time' }) lockedAt!: string
  @ApiProperty({ type: String }) lockedById!: string

  static fromDomain(domain: {
    academicYearId: string
    lockedAt: Date
    lockedById: string
  }): AdmissionNisLockResponseDto {
    const dto = new AdmissionNisLockResponseDto()
    dto.academicYearId = domain.academicYearId
    dto.lockedAt = domain.lockedAt.toISOString()
    dto.lockedById = domain.lockedById
    return dto
  }
}

export class AdmissionEnrollmentResultDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ enum: ['ENROLLED', 'SKIPPED', 'FAILED'] }) outcome!:
    'ENROLLED' | 'SKIPPED' | 'FAILED'
  @ApiProperty({ type: String, required: false }) reason?: string
}

export class AdmissionEnrollmentProcessResponseDto {
  @ApiProperty({ type: () => [AdmissionEnrollmentResultDto] })
  results!: AdmissionEnrollmentResultDto[]

  static fromDomain(domain: {
    results: AdmissionEnrollmentResultDto[]
  }): AdmissionEnrollmentProcessResponseDto {
    const dto = new AdmissionEnrollmentProcessResponseDto()
    dto.results = domain.results.map((result) =>
      Object.assign(new AdmissionEnrollmentResultDto(), result),
    )
    return dto
  }
}

export class AdmissionPlacementResponseDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ enum: ['NEW', 'TRANSFER'] }) admissionType!: 'NEW' | 'TRANSFER'
  @ApiProperty({ type: String }) targetGradeId!: string
  @ApiProperty({ type: Number }) targetGradeLevel!: number
  @ApiProperty({ type: Boolean }) nisCleared!: boolean

  static fromDomain(
    domain: AdmissionPlacementResponseDto,
  ): AdmissionPlacementResponseDto {
    return Object.assign(new AdmissionPlacementResponseDto(), domain)
  }
}
