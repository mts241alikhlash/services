import { ApiProperty } from '@nestjs/swagger'

export class RegionResponseDto {
  @ApiProperty({
    example: '32.04.01.2001',
    description:
      'Kemendagri code. Two digits for a province, and one more dotted segment per level below it.',
  })
  code!: string

  @ApiProperty({ example: 'Cileunyi' }) name!: string

  @ApiProperty({ enum: ['PROVINCE', 'REGENCY', 'DISTRICT', 'VILLAGE'] })
  level!: string

  @ApiProperty({ nullable: true, example: '32.04' })
  parentCode!: string | null
}

export class RegionListResponseDto {
  @ApiProperty({ type: () => [RegionResponseDto] })
  data!: RegionResponseDto[]
}
