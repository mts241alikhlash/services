import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

export class SetAccountActiveDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive: boolean
}
