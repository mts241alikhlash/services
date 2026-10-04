import { ApiProperty } from '@nestjs/swagger'
import { PositionResponseDto } from '../../../../../reference-data/position/presentation/http/dto/response/position-response.dto.js'
import type { EmployeePositionWithDetails } from '../../../../domain/entities/employee-position.entity.js'

export class EmployeePositionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id!: string

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Position UUID',
  })
  positionId!: string

  @ApiProperty({ example: '2020-01-01T00:00:00.000Z' })
  hireDate!: string

  @ApiProperty({ example: false })
  isPrimary!: boolean

  @ApiProperty({ type: () => PositionResponseDto, nullable: true })
  position!: PositionResponseDto | null

  static fromDomain(
    link: EmployeePositionWithDetails,
  ): EmployeePositionResponseDto {
    const dto = new EmployeePositionResponseDto()
    dto.id = link.id
    dto.positionId = link.positionId
    dto.hireDate = link.hireDate.toISOString()
    dto.isPrimary = link.isPrimary
    dto.position = link.position
      ? {
          id: link.position.id,
          name: link.position.name,
          isActive: link.position.isActive,
          category: {
            id: link.position.category.id,
            code: link.position.category.code,
            name: link.position.category.name,
          },
        }
      : null
    return dto
  }
}
