import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class NativeLoginDto {
  @ApiProperty({ example: '2024001', description: 'NIS or NIP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  identifier!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string

  @ApiProperty({ description: 'Identifier of the tablet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceId!: string
}

export class NativeRefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  refreshToken!: string

  @ApiProperty({ description: 'Must be the tablet that signed in' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceId!: string
}

export class NativeLogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  refreshToken!: string
}
