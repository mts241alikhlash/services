import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../../../../shared/dto/pagination.dto.js'

export class EnrolmentQueueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['ready', 'held', 'done'], default: 'ready' })
  @IsOptional()
  @IsIn(['ready', 'held', 'done'])
  tab?: 'ready' | 'held' | 'done'

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
