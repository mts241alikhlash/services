import type { RequestPasswordResetResult } from '../../../../application/use-cases/request-password-reset/request-password-reset.use-case.js'
import type { GetProfileUseCase } from '../../../../application/use-cases/get-profile/get-profile.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { IntrospectionResult } from '../../../../application/use-cases/introspect-token/introspect-token.use-case.js'

export class AuthIntrospectionResponseDto {
  @ApiProperty({ type: Boolean })
  active!: boolean

  @ApiPropertyOptional({ type: String })
  userId?: string

  @ApiPropertyOptional({ type: String })
  identifier?: string

  @ApiPropertyOptional({ type: String })
  sessionId?: string

  @ApiPropertyOptional({ type: String, isArray: true })
  roles?: string[]

  @ApiPropertyOptional({ type: String, isArray: true })
  permissions?: string[]

  static fromDomain(domain: IntrospectionResult): AuthIntrospectionResponseDto {
    const dto = new AuthIntrospectionResponseDto()
    dto.active = domain.active
    dto.userId = domain.userId
    dto.identifier = domain.identifier
    dto.sessionId = domain.sessionId
    if (domain.roles !== undefined)
      dto.roles = domain.roles == null ? domain.roles : [...domain.roles]
    if (domain.permissions !== undefined)
      dto.permissions =
        domain.permissions == null
          ? domain.permissions
          : [...domain.permissions]
    return dto
  }
}

export class AuthMeResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  @ApiProperty({ type: String, isArray: true })
  roles!: string[]

  @ApiProperty({ type: String, isArray: true })
  permissions!: string[]

  static fromDomain(
    domain: Awaited<ReturnType<GetProfileUseCase['execute']>>,
  ): AuthMeResponseDto {
    const dto = new AuthMeResponseDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    dto.name = domain.name
    dto.roles = [...domain.roles]
    dto.permissions = [...domain.permissions]
    return dto
  }
}

export class AuthPasswordResetRequestResponseDto {
  @ApiProperty({ type: Boolean })
  success!: boolean

  @ApiProperty({ type: String })
  message!: string

  @ApiPropertyOptional({ type: String })
  debugToken?: string

  static fromDomain(
    domain: RequestPasswordResetResult,
  ): AuthPasswordResetRequestResponseDto {
    const dto = new AuthPasswordResetRequestResponseDto()
    dto.success = domain.success
    dto.message = domain.message
    dto.debugToken = domain.debugToken
    return dto
  }
}

export class AuthSessionUserResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean
}

export class AuthLoginUserResponseDto extends AuthSessionUserResponseDto {
  @ApiProperty({ type: String, isArray: true })
  roles!: string[]
}

export class AuthLoginResponseDto {
  @ApiProperty({ type: String })
  accessToken!: string

  @ApiProperty({ type: () => AuthLoginUserResponseDto })
  user!: AuthLoginUserResponseDto
}

export class AuthRefreshResponseDto {
  @ApiProperty({ type: String })
  accessToken!: string

  @ApiProperty({ type: () => AuthSessionUserResponseDto })
  user!: AuthSessionUserResponseDto
}

export class AuthMessageResponseDto {
  @ApiProperty({ type: String })
  message!: string
}

export class AuthResultResponseDto {
  @ApiProperty({ type: Boolean })
  success!: boolean

  @ApiProperty({ type: String })
  message!: string
}

export class SsoExchangeResponseDto {
  @ApiProperty({ type: String })
  accessToken!: string
}

export class SsoAppResponseDto {
  @ApiProperty({ type: String, example: 'hr' })
  key!: string

  @ApiProperty({ type: String, example: 'Kepegawaian' })
  label!: string

  @ApiProperty({ type: String, example: 'https://hr.example.sch.id' })
  url!: string
}
