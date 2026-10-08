import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class LockNisDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicYearId!: string
}
