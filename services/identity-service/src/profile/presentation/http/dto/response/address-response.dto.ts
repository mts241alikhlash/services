import { ApiProperty } from '@nestjs/swagger'

export class AddressDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ example: 'Jl. Veteran No. 1' }) street!: string
  @ApiProperty({ example: '001' }) rt!: string
  @ApiProperty({ example: '002' }) rw!: string
  @ApiProperty({ example: 'Penanggungan' }) village!: string
  @ApiProperty({ example: 'Klojen' }) district!: string
  @ApiProperty({ example: 'Kota Malang' }) city!: string
  @ApiProperty({ example: 'Jawa Timur' }) province!: string
  @ApiProperty({ example: 'Indonesia' }) country!: string
  @ApiProperty({ example: '65113' }) postalCode!: string
  @ApiProperty({
    example: false,
    description:
      'At most one address per person carries this. Setting it clears the flag on the others.',
  })
  isPrimary!: boolean
  @ApiProperty({ example: -6.914744, nullable: true })
  latitude!: number | null
  @ApiProperty({ example: 107.60981, nullable: true })
  longitude!: number | null
}

export class AddressListResponseDto {
  @ApiProperty({ type: () => [AddressDto] })
  data!: AddressDto[]
}

export class AddressSingleResponseDto {
  @ApiProperty({ type: () => AddressDto })
  data!: AddressDto
}

export class AddressesForUserDto {
  @ApiProperty({ format: 'uuid' }) userId!: string
  @ApiProperty({ type: () => [AddressDto] })
  addresses!: AddressDto[]
}

export class AddressBatchResponseDto {
  @ApiProperty({
    type: () => [AddressesForUserDto],
    description:
      'One entry per user id that has a profile. A user with no profile is absent, not empty.',
  })
  data!: AddressesForUserDto[]
}
