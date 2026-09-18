import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator'

export class CreateUnitsDto {
  @ApiPropertyOptional({ description: 'Jumlah unit tambahan', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number

  @ApiProperty({ description: 'Condition UUID (default unit baru)' })
  @IsNotEmpty()
  @IsUUID()
  conditionId: string

  @ApiProperty({ description: 'Status UUID (default unit baru)' })
  @IsNotEmpty()
  @IsUUID()
  statusId: string

  @ApiProperty({ description: 'Location UUID (default unit baru)' })
  @IsNotEmpty()
  @IsUUID()
  locationId: string
}
