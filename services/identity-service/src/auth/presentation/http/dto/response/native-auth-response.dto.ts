import { ApiProperty } from '@nestjs/swagger'
import type { NativeAuthResult } from '../../../../application/use-cases/native-auth/native-login.use-case.js'
import type { NativeRefreshResult } from '../../../../application/use-cases/native-auth/native-refresh.use-case.js'

export class NativeUserDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty({ type: String, isArray: true }) roles!: string[]
}

export class NativeAuthResponseDto {
  @ApiProperty() accessToken!: string
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Null when the call raced another refresh: keep the token you hold',
  })
  refreshToken!: string | null
  @ApiProperty({ description: 'Access token lifetime in seconds' })
  expiresIn!: number
  @ApiProperty({ type: () => NativeUserDto }) user!: NativeUserDto

  static fromDomain(
    domain: NativeAuthResult | NativeRefreshResult,
  ): NativeAuthResponseDto {
    const dto = new NativeAuthResponseDto()
    dto.accessToken = domain.accessToken
    dto.refreshToken = domain.refreshToken
    dto.expiresIn = domain.expiresIn
    dto.user = {
      id: domain.user.id,
      name: domain.user.name,
      roles: domain.user.roles,
    }
    return dto
  }
}
