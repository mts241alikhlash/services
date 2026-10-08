import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { PaginationQueryDto } from '../../../../../../shared/dto/pagination.dto.js'

export class DocumentReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  override limit?: number = 20

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
