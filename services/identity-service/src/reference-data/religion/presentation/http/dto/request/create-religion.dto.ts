import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class CreateReligionDto {
  @ApiProperty({ example: 'Islam', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
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
