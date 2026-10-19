import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../../../../shared/dto/pagination.dto.js'

const STATES = ['OPEN', 'MISSING', 'PENDING', 'REJECTED', 'APPROVED'] as const

export class LateDocumentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by applicant name or registration number',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  documentTypeId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  waveId?: string

  @ApiPropertyOptional({
    enum: STATES,
    default: 'OPEN',
    description: 'OPEN is MISSING, PENDING and REJECTED',
  })
  @IsOptional()
  @IsIn(STATES)
  state?: (typeof STATES)[number]
}
