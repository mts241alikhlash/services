import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsString, Matches, MaxLength } from 'class-validator'

export class SsoAuthorizeQueryDto {
  @ApiProperty({ example: 'hr' })
  @IsString()
  @MaxLength(30)
  app!: string

  @ApiProperty({ example: 'https://hr.example.sch.id/oauth/callback' })
  @IsString()
  @MaxLength(512)
  redirect_uri!: string

  @ApiProperty({ description: 'base64url SHA-256 of the code verifier' })
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  code_challenge!: string

  @ApiProperty({ enum: ['S256'] })
  @IsIn(['S256'])
  code_challenge_method!: string

  @ApiProperty()
  @Matches(/^[A-Za-z0-9_-]{16,128}$/)
  state!: string
}
