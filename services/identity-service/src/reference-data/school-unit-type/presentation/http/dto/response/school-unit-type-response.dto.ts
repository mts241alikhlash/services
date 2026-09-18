import { ApiProperty } from '@nestjs/swagger'

export class SchoolUnitTypeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ example: 'NEGERI' })
  code!: string

  @ApiProperty({ example: 'Sekolah Negeri' })
  name!: string

  @ApiProperty({ example: true })
  isActive!: boolean
}

export class DeleteSchoolUnitTypeResponseDto {
  @ApiProperty({ example: true })
  success!: boolean
}
