import { ApiProperty } from '@nestjs/swagger'

export class BulkGenerateReportCardResponseDto {
  @ApiProperty({ description: 'Active enrollments considered' })
  total!: number

  @ApiProperty({ description: 'Report cards generated or regenerated' })
  generated!: number

  @ApiProperty({
    description: 'Enrollments left alone because their card is published',
  })
  skipped!: number

  @ApiProperty({
    description: 'Enrollment ids whose card was left published and untouched',
    type: [String],
  })
  skippedEnrollmentIds!: string[]
}
