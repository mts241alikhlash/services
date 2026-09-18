import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsIn,
  IsUUID,
  ValidateNested,
  IsOptional,
} from 'class-validator'
import { BulkImportEmployeeRowDto } from './bulk-import-employee.dto.js'

export class ResolveBulkImportConflictDto {
  @ApiProperty({
    description: 'Existing employee ID this row conflicts with',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  existingId?: string

  @ApiProperty({ enum: ['update', 'skip'] })
  @IsIn(['update', 'skip'])
  action: 'update' | 'skip'

  @ApiProperty({ type: BulkImportEmployeeRowDto })
  @ValidateNested()
  @Type(() => BulkImportEmployeeRowDto)
  data: BulkImportEmployeeRowDto
}

export class ResolveBulkImportConflictsDto {
  @ApiProperty({ type: [ResolveBulkImportConflictDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResolveBulkImportConflictDto)
  conflicts: ResolveBulkImportConflictDto[]
}
