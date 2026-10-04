import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { RegionEntity } from '../../../../domain/repositories/region.repository.js'

export class RegionNodeResponseDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ enum: ['PROVINCE', 'REGENCY', 'DISTRICT', 'VILLAGE'] })
  level!: 'PROVINCE' | 'REGENCY' | 'DISTRICT' | 'VILLAGE'

  @ApiProperty({ type: String, nullable: true })
  parentCode!: string | null

  static fromDomain(domain: RegionEntity): RegionNodeResponseDto {
    const dto = new RegionNodeResponseDto()
    dto.code = domain.code
    dto.name = domain.name
    dto.level = domain.level
    dto.parentCode = domain.parentCode
    return dto
  }
}

export class RegionNodeListResponseDto {
  @ApiProperty({ type: () => [RegionNodeResponseDto] })
  data!: RegionNodeResponseDto[]
}
