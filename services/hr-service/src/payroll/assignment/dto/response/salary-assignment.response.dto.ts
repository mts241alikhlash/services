import { ApiProperty } from '@nestjs/swagger'
import {
  AttendanceDriver,
  SalaryComponentType,
} from '../../../../generated/prisma/client.js'
import type { SalaryAssignmentWithComponent } from '../../domain/entities/salary-assignment.entity.js'

export class SalaryAssignmentComponentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ example: 'GAPOK' }) code!: string
  @ApiProperty({ example: 'Gaji Pokok' }) name!: string
  @ApiProperty({ enum: SalaryComponentType })
  type!: `${SalaryComponentType}`
  @ApiProperty({ enum: AttendanceDriver, nullable: true })
  driver!: string | null
}

export class SalaryAssignmentHolderResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ type: String, nullable: true }) displayName!: string | null
}

export class SalaryAssignmentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) userId!: string
  @ApiProperty({ format: 'uuid' }) componentId!: string
  @ApiProperty({ type: String, nullable: true, example: '3500000.00' })
  amount!: string | null
  @ApiProperty({ type: String, nullable: true, example: '25000.00' })
  rate!: string | null
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' }) effectiveFrom!: string
  @ApiProperty({ type: String, nullable: true }) effectiveTo!: string | null
  @ApiProperty({ format: 'uuid' }) createdBy!: string
  @ApiProperty({ type: () => SalaryAssignmentComponentResponseDto })
  component!: SalaryAssignmentComponentResponseDto
  @ApiProperty({ type: () => SalaryAssignmentHolderResponseDto })
  holder!: SalaryAssignmentHolderResponseDto

  static fromDomain(
    assignment: SalaryAssignmentWithComponent,
  ): SalaryAssignmentResponseDto {
    const dto = new SalaryAssignmentResponseDto()
    dto.id = assignment.id
    dto.userId = assignment.userId
    dto.componentId = assignment.componentId
    dto.amount = assignment.amount
    dto.rate = assignment.rate
    dto.effectiveFrom = assignment.effectiveFrom.toISOString()
    dto.effectiveTo = assignment.effectiveTo?.toISOString() ?? null
    dto.createdBy = assignment.createdBy
    dto.component = {
      id: assignment.component.id,
      code: assignment.component.code,
      name: assignment.component.name,
      type: assignment.component.type,
      driver: assignment.component.driver,
    }
    dto.holder = {
      id: assignment.holder.id,
      displayName: assignment.holder.displayName,
    }
    return dto
  }
}
