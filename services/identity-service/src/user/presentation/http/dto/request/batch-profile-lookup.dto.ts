import { ApiProperty } from '@nestjs/swagger'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator'

const MAX_BATCH_SIZE = 200

export class BatchProfileLookupDto {
  @ApiProperty({
    type: [String],
    description: `User IDs to resolve, up to ${MAX_BATCH_SIZE} at a time.`,
    example: ['9a9e3ee8-4a56-4c74-a029-798dfb0a3909'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_SIZE)
  @IsUUID('4', { each: true })
  userIds!: string[]
}
