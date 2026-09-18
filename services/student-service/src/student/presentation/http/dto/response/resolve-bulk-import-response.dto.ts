import { ApiProperty } from '@nestjs/swagger'

export class ResolveBulkImportErrorDto {
  @ApiProperty({
    example: 3,
    description:
      'Position of the failed item in the submitted array, so the caller can ' +
      'mark the row it came from rather than guessing.',
  })
  index: number

  @ApiProperty()
  existingId: string

  @ApiProperty()
  error: string
}

export class ResolveBulkImportResponseDto {
  @ApiProperty({ example: 5, description: 'Total rows submitted' })
  total: number

  @ApiProperty({ example: 3, description: 'Rows created or updated' })
  updated: number

  @ApiProperty({ example: 2, description: 'Rows the caller chose to skip' })
  skipped: number

  @ApiProperty({ example: 0, description: 'Rows that threw while processing' })
  failed: number

  @ApiProperty({ type: [ResolveBulkImportErrorDto] })
  errors: ResolveBulkImportErrorDto[]
}
