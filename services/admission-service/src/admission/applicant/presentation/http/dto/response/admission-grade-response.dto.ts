import { ApiProperty } from '@nestjs/swagger'

export class AdmissionGradeResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  level!: number

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(domain: {
    id: string
    level: number
    name: string | null
  }): AdmissionGradeResponseDto {
    const dto = new AdmissionGradeResponseDto()
    dto.id = domain.id
    dto.level = domain.level
    dto.name = domain.name
    return dto
  }
}

export class AdmissionGradeListResponseDto {
  @ApiProperty({ type: () => [AdmissionGradeResponseDto] })
  data!: AdmissionGradeResponseDto[]

  static fromDomain(domain: {
    data: { id: string; level: number; name: string | null }[]
  }): AdmissionGradeListResponseDto {
    const dto = new AdmissionGradeListResponseDto()
    dto.data = domain.data.map((grade) =>
      AdmissionGradeResponseDto.fromDomain(grade),
    )
    return dto
  }
}
