import { ApiProperty } from '@nestjs/swagger'
import { BulkImportEmployeeRowDto } from '../request/bulk-import-employee.dto.js'
import type { EmployeeImportRowEntity } from '../../../../domain/entities/employee-import-row.entity.js'

export class BulkImportEmployeeRowResultDto {
  @ApiProperty({ example: 2, description: 'Excel row number (1 = header)' })
  row: number

  @ApiProperty({
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAILED', 'CONFLICT'],
    description:
      'CONFLICT means the row matches an existing employee by NIK/NIP/NUPTK. ' +
      'It is not applied automatically — resend it to the resolve endpoint ' +
      'with an "update" or "skip" decision. A taken identifier/username is ' +
      'still a hard FAILED, since it belongs to an unrelated account.',
  })
  status: 'SUCCESS' | 'FAILED' | 'CONFLICT'

  @ApiProperty({ example: 'guru001', required: false })
  identifier?: string

  @ApiProperty({
    required: false,
    example: 'Validation failed: identifier must not be empty',
    description: 'Error detail. Present when status is FAILED or CONFLICT.',
  })
  error?: string

  @ApiProperty({
    required: false,
    description: 'Existing employee ID this row conflicts with.',
  })
  existingId?: string

  @ApiProperty({
    required: false,
    type: BulkImportEmployeeRowDto,
    description:
      'The parsed row data, echoed back so the client can resend it to the ' +
      'resolve endpoint without re-parsing the Excel file.',
  })
  data?: EmployeeImportRowEntity
}

export class BulkImportEmployeesResponseDto {
  @ApiProperty({ example: 10, description: 'Total rows processed' })
  total: number

  @ApiProperty({ example: 8 })
  success: number

  @ApiProperty({ example: 2 })
  failed: number

  @ApiProperty({
    example: 1,
    description: 'Rows skipped because they match an existing employee.',
  })
  conflict: number

  @ApiProperty({
    type: [BulkImportEmployeeRowResultDto],
    description:
      'Per-row result. Failed rows include row number and error detail.',
  })
  results: BulkImportEmployeeRowResultDto[]
}
