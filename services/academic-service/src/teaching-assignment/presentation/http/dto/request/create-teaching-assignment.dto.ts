import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsUUID } from 'class-validator'

export class CreateTeachingAssignmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string

  @ApiProperty({
    description: 'One assignment row is created per classroom',
    type: [String],
    format: 'uuid',
    example: ['uuid-class-vii-a', 'uuid-class-vii-b'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  classroomIds: string[]

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  semesterId: string
}
