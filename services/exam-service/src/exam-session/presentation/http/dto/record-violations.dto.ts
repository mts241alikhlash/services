import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Max, Min } from 'class-validator'

export class RecordViolationsRequestDto {
  @ApiProperty({
    description:
      'How many times the app saw the student leave the exam so far; the server keeps the highest value it was told, so send 0 to only read it back',
    minimum: 0,
    maximum: 1000,
  })
  @IsInt()
  @Min(0)
  @Max(1000)
  count!: number
}

export class ViolationCountDto {
  @ApiProperty({ minimum: 0 }) violationCount!: number

  static of(violationCount: number): ViolationCountDto {
    const dto = new ViolationCountDto()
    dto.violationCount = violationCount
    return dto
  }
}
