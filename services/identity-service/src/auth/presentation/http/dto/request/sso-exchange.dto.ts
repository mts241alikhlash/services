import { ApiProperty } from '@nestjs/swagger'
import { IsString, Matches, MaxLength } from 'class-validator'

export class SsoExchangeDto {
  @ApiProperty()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  code!: string

  @ApiProperty()
  @Matches(/^[A-Za-z0-9._~-]{43,128}$/)
  code_verifier!: string

  @ApiProperty()
  @IsString()
  @MaxLength(512)
  redirect_uri!: string
}
