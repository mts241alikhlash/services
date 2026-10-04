import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class CreateBloodTypeDto {
  @ApiProperty({ example: 'O+', maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  name!: string

  @ApiPropertyOptional({
    default: true,
    description:
      'An inactive entry stays on the profiles that already reference it and disappears from the pickers.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
