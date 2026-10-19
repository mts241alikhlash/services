import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class NisPreviewQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicYearId!: string
}
