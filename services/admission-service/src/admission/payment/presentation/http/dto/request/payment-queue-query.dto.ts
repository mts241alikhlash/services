import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../../../../shared/dto/pagination.dto.js'

export class PaymentQueueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
  })
  @IsOptional()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED'

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

export class EligibleApplicationsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by applicant name or registration number',
  })
  @IsOptional()
  @IsString()
  search?: string
}
