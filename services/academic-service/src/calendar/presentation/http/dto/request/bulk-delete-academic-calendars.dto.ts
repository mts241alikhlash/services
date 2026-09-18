import { ApiProperty } from '@nestjs/swagger'
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator'

export class BulkDeleteAcademicCalendarsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Ids to soft-delete. The whole request is refused if any id is unknown, so a partial delete never happens silently.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  ids!: string[]
}
