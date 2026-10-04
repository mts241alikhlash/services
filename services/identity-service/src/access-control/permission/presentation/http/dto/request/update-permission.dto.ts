import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'Export inventory data to CSV' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string
}
