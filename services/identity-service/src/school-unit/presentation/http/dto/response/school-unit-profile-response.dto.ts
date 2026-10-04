import { ApiProperty } from '@nestjs/swagger'

export class SchoolUnitProfileResponseDto {
  @ApiProperty({ example: 'SMA Negeri 1' })
  name!: string

  @ApiProperty({ example: 'contact@school.sch.id', nullable: true })
  email!: string | null

  @ApiProperty({ example: '021-1234567', nullable: true })
  phone!: string | null
}
