import { ApiProperty } from '@nestjs/swagger'

export class EmployeeRosterResponseDto {
  @ApiProperty({
    type: [String],
    description:
      'User ids of every employee on the books, soft-deleted ones excluded. ' +
      'Not filtered by position, position category, or employment type.',
    example: ['0f8c3b3e-4a4f-4a3a-9a7a-2c5f6b1d9e10'],
  })
  data!: string[]
}
