import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsUUID } from 'class-validator'

export class SetPlacementDto {
  @ApiProperty({ enum: ['NEW', 'TRANSFER'] })
  @IsIn(['NEW', 'TRANSFER'])
  admissionType!: 'NEW' | 'TRANSFER'

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetGradeId!: string
}
