import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class AssetUnitQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number

  @ApiPropertyOptional({
    description:
      'Only units whose status permits transactions — what a loan form needs. ' +
      'Units already reserved by a pending loan, or out on an approved one, ' +
      'hold a status that forbids transactions and are excluded by the same rule.',
  })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  lendable?: boolean

  @ApiPropertyOptional({ description: 'Matches unit number or asset name.' })
  @IsString()
  @IsOptional()
  search?: string
}
