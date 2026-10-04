import type { DeleteSchoolUnitTypeUseCase } from '../../../../application/use-cases/delete-school-unit-type/delete-school-unit-type.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { SchoolUnitTypeEntity } from '../../../../domain/entities/school-unit-type.entity.js'

export class SchoolUnitTypeItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: SchoolUnitTypeEntity,
  ): SchoolUnitTypeItemResponseDto {
    const dto = new SchoolUnitTypeItemResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class SchoolUnitTypeDeletedResponseDto {
  @ApiProperty({ type: Boolean })
  success!: boolean

  static fromDomain(
    domain: Awaited<ReturnType<DeleteSchoolUnitTypeUseCase['execute']>>,
  ): SchoolUnitTypeDeletedResponseDto {
    const dto = new SchoolUnitTypeDeletedResponseDto()
    dto.success = domain.success
    return dto
  }
}
