import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { ApproveQuestionDto } from './approve-question.dto.js'

export class ApproveManyItemDto extends ApproveQuestionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string
}

export class ApproveManyDto {
  @ApiProperty({ type: () => [ApproveManyItemDto], minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ApproveManyItemDto)
  items!: ApproveManyItemDto[]
}
