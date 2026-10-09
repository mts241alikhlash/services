import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsObject } from 'class-validator'

export class SaveAdmissionLandingSectionDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'The section document; its fields are checked per section',
  })
  @IsObject()
  content!: Record<string, unknown>
}

export class UploadAdmissionLandingImageDto {
  @ApiProperty({ enum: ['poster', 'photo'] })
  @IsIn(['poster', 'photo'])
  purpose!: 'poster' | 'photo'
}
