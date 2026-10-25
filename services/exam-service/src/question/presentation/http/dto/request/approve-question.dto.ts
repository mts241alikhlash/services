import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min } from 'class-validator'

export class ApproveQuestionDto {
  @ApiProperty({
    minimum: 1,
    description: 'The revision of the question the reviewer read',
  })
  @IsInt()
  @Min(1)
  revision!: number
}
