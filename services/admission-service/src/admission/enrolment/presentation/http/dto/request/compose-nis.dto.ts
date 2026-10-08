import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator'

export class ComposeNisDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicYearId!: string

  @ApiProperty({
    description: 'The number of existing NIS the preview said would change',
  })
  @IsInt()
  @Min(0)
  expectedChanges!: number

  @ApiPropertyOptional({
    description: 'Push the NIS of every enrolled student again',
  })
  @IsOptional()
  @IsBoolean()
  syncStudents?: boolean
}
