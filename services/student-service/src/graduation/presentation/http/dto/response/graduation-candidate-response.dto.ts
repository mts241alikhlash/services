import { ApiProperty } from '@nestjs/swagger'

export class GraduationPreviousHoldDto {
  @ApiProperty({ format: 'uuid' }) academicYearId: string
  @ApiProperty({ example: '2026/2027' }) academicYearName: string
  @ApiProperty({ example: 'Nilai belum lengkap' }) reason: string
  @ApiProperty({ type: String, format: 'date-time' }) decidedAt: Date
}

export class GraduationCandidateDto {
  @ApiProperty() studentId: string
  @ApiProperty() studentName: string
  @ApiProperty() nis: string
  @ApiProperty() classroomId: string
  @ApiProperty() classroomName: string
  @ApiProperty() gradeName: string

  @ApiProperty({ type: GraduationPreviousHoldDto, required: false })
  previousHold?: GraduationPreviousHoldDto
}

export class GraduationHoldDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty({ format: 'uuid' }) studentId: string
  @ApiProperty() studentName: string
  @ApiProperty() nis: string
  @ApiProperty({ format: 'uuid' }) academicYearId: string
  @ApiProperty({ example: '2026/2027' }) academicYearName: string
  @ApiProperty({ example: 'Nilai belum lengkap' }) reason: string
  @ApiProperty({ type: String, format: 'date-time' }) decidedAt: Date
}

export class BulkGraduationResultDto {
  @ApiProperty() graduated: number

  @ApiProperty({ description: 'Already held a graduation record' })
  skipped: number

  @ApiProperty({
    description:
      'Students recorded as held back. A rerun rewrites the reason rather ' +
      'than stacking a second hold.',
  })
  held: number
}

export class GraduationYearDto {
  @ApiProperty() id: string
  @ApiProperty({ example: '2026/2027' }) name: string
}

export class GraduationCandidateListDto {
  @ApiProperty({ type: GraduationYearDto, nullable: true })
  academicYear: GraduationYearDto | null

  @ApiProperty({ example: 'IX', nullable: true })
  finalGradeName: string | null

  @ApiProperty({ type: [GraduationCandidateDto] })
  students: GraduationCandidateDto[]
}
