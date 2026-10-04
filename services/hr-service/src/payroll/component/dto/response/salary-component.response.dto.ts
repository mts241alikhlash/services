import { ApiProperty } from '@nestjs/swagger'
import {
  AttendanceDriver,
  SalaryComponentType,
} from '../../../../generated/prisma/client.js'
import type { SalaryComponentEntity } from '../../domain/entities/salary-component.entity.js'

export class SalaryComponentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ example: 'GAPOK' }) code!: string
  @ApiProperty({ example: 'Gaji Pokok' }) name!: string
  @ApiProperty({ enum: SalaryComponentType })
  type!: `${SalaryComponentType}`
  @ApiProperty({ enum: AttendanceDriver, nullable: true })
  driver!: `${AttendanceDriver}` | null
  @ApiProperty() isActive!: boolean

  static fromDomain(
    component: SalaryComponentEntity,
  ): SalaryComponentResponseDto {
    const dto = new SalaryComponentResponseDto()
    dto.id = component.id
    dto.code = component.code
    dto.name = component.name
    dto.type = component.type
    dto.driver = component.driver ?? null
    dto.isActive = component.isActive
    return dto
  }
}
