import { ApiProperty } from '@nestjs/swagger'

export class SessionIdentityDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string

  @ApiProperty({ example: 'admin01' })
  identifier!: string

  @ApiProperty({ example: true })
  isActive!: boolean

  @ApiProperty({ example: 'Ahmad Fauzi', nullable: true })
  name!: string | null

  @ApiProperty({ example: ['ADMIN'], type: [String] })
  roles!: string[]

  @ApiProperty({
    example: ['students.read', 'presence-records.read'],
    type: [String],
  })
  permissions!: string[]
}
