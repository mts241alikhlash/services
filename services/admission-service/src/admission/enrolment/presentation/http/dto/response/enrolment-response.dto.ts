import { ApiProperty } from '@nestjs/swagger'

export class AdmissionEnrolmentRowResponseDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ type: String }) registrationNumber!: string
  @ApiProperty({ type: String }) applicantName!: string
  @ApiProperty({ type: String }) waveName!: string
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ type: String }) status!: string
  @ApiProperty({ enum: ['NEW', 'TRANSFER'], nullable: true }) admissionType!:
    'NEW' | 'TRANSFER' | null
  @ApiProperty({ type: Number, nullable: true }) targetGradeLevel!:
    number | null
  @ApiProperty({ type: String, nullable: true }) nis!: string | null
  @ApiProperty({ type: String, nullable: true }) nisn!: string | null
  @ApiProperty({ type: String, nullable: true }) enrolledStudentId!:
    string | null

  static fromDomain(
    domain: AdmissionEnrolmentRowResponseDto,
  ): AdmissionEnrolmentRowResponseDto {
    return Object.assign(new AdmissionEnrolmentRowResponseDto(), domain)
  }
}

export class AdmissionEnrolmentCountsDto {
  @ApiProperty({ type: Number }) ready!: number
  @ApiProperty({ type: Number }) held!: number
  @ApiProperty({ type: Number }) done!: number
}

export class AdmissionEnrolmentYearDto {
  @ApiProperty({ type: String }) academicYearId!: string
  @ApiProperty({ type: String, nullable: true }) academicYearName!:
    string | null
  @ApiProperty({ type: Boolean }) locked!: boolean
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lockedAt!: string | null
}

export class AdmissionEnrolmentMetaDto {
  @ApiProperty({ type: Number }) page!: number
  @ApiProperty({ type: Number }) limit!: number
  @ApiProperty({ type: Number }) total!: number
  @ApiProperty({ type: Number }) totalPages!: number
  @ApiProperty({ type: () => AdmissionEnrolmentCountsDto })
  counts!: AdmissionEnrolmentCountsDto
  @ApiProperty({ type: () => [AdmissionEnrolmentYearDto] })
  years!: AdmissionEnrolmentYearDto[]
}

export class AdmissionEnrolmentQueueResponseDto {
  @ApiProperty({ type: () => [AdmissionEnrolmentRowResponseDto] })
  data!: AdmissionEnrolmentRowResponseDto[]

  @ApiProperty({ type: () => AdmissionEnrolmentMetaDto })
  meta!: AdmissionEnrolmentMetaDto

  static fromDomain(domain: {
    data: AdmissionEnrolmentRowResponseDto[]
    meta: Omit<AdmissionEnrolmentMetaDto, 'years'> & {
      years: (Omit<AdmissionEnrolmentYearDto, 'lockedAt'> & {
        lockedAt: Date | null
      })[]
    }
  }): AdmissionEnrolmentQueueResponseDto {
    const dto = new AdmissionEnrolmentQueueResponseDto()
    dto.data = domain.data.map((row) =>
      AdmissionEnrolmentRowResponseDto.fromDomain(row),
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

  static fromDomain(domain: {
    academicYearId: string
    lockedAt: Date
  }): AdmissionNisLockResponseDto {
    const dto = new AdmissionNisLockResponseDto()
    dto.academicYearId = domain.academicYearId
    dto.lockedAt = domain.lockedAt.toISOString()
    return dto
  }
}

export class AdmissionEnrolmentResultDto {
  @ApiProperty({ type: String }) applicationId!: string
  @ApiProperty({ enum: ['ENROLLED', 'SKIPPED', 'FAILED'] }) outcome!:
    'ENROLLED' | 'SKIPPED' | 'FAILED'
  @ApiProperty({ type: String, required: false }) reason?: string
}

export class AdmissionEnrolmentProcessResponseDto {
  @ApiProperty({ type: () => [AdmissionEnrolmentResultDto] })
  results!: AdmissionEnrolmentResultDto[]

  static fromDomain(domain: {
    results: AdmissionEnrolmentResultDto[]
  }): AdmissionEnrolmentProcessResponseDto {
    const dto = new AdmissionEnrolmentProcessResponseDto()
    dto.results = domain.results.map((result) =>
      Object.assign(new AdmissionEnrolmentResultDto(), result),
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
