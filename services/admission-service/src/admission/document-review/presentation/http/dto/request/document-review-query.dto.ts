import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../../../../shared/dto/pagination.dto.js'

export class DocumentReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['waiting', 'revision', 'done'],
    default: 'waiting',
  })
  @IsOptional()
  @IsIn(['waiting', 'revision', 'done'])
  tab?: 'waiting' | 'revision' | 'done'

  @ApiPropertyOptional({
    description: 'Search by applicant name or registration number',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  waveId?: string
}
