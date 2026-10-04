import { ApiProperty } from '@nestjs/swagger'
import type { EmploymentTypeEntity } from '../../../../domain/entities/employment-type.entity.js'
import type { PaginationMeta } from '../../../../../../shared/domain/interfaces/repository.interface.js'

export class EmploymentTypeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440007' })
  id!: string

  @ApiProperty({ example: 'PNS' })
  code!: string

  @ApiProperty({ example: 'Civil Servant' })
  name!: string

  static fromDomain(type: EmploymentTypeEntity): EmploymentTypeResponseDto {
    const dto = new EmploymentTypeResponseDto()
    dto.id = type.id
    dto.code = type.code
    dto.name = type.name
    return dto
  }
}

export class EmploymentTypeListResponseDto {
  @ApiProperty({ type: () => [EmploymentTypeResponseDto] })
  data!: EmploymentTypeResponseDto[]

  @ApiProperty({ example: { page: 1, limit: 10, total: 5, totalPages: 1 } })
  meta!: PaginationMeta
}
