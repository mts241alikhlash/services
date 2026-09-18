import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class IntrospectTokenDto {
  @ApiProperty({ description: 'The access token to check' })
  @IsString()
  @IsNotEmpty()
  token: string
}
