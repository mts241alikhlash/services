import { ApiProperty } from '@nestjs/swagger'
import { EmploymentTypeResponseDto } from '../../../../../reference-data/employment-type/presentation/http/dto/response/employment-type-response.dto.js'
import { ProfileResponseDto } from '../../../../../platform/profile/dto/response/profile-response.dto.js'
import type { ProfileEntity } from '../../../../../platform/profile/domain/entities/profile.entity.js'
import type { UserEntity } from '../../../../../shared/domain/entities/user.entity.js'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'
import type { PaginationMeta } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type { EmployeeWithDetails } from '../../../../domain/entities/employee.entity.js'
import { EmployeePositionResponseDto } from './employee-position-response.dto.js'

export class EmployeeProfileRefResponseDto {
  @ApiProperty({ example: 'Budi Santoso' })
  name!: string

  @ApiProperty({ example: '3201011505800001' })
  nik!: string

  @ApiProperty({ enum: UserGender, example: UserGender.MALE })
  gender!: `${UserGender}`
}

export class EmployeeUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string

  @ApiProperty({ example: '198006152005011001' })
  identifier!: string

  @ApiProperty({ example: true })
  isActive!: boolean

  @ApiProperty({ type: () => EmployeeProfileRefResponseDto, nullable: true })
  profile!: EmployeeProfileRefResponseDto | null
}

export class EmployeeAccountStatusResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string

  @ApiProperty({ example: '198006152005011001' })
  identifier!: string

  @ApiProperty({ example: false })
  isActive!: boolean

  static fromDomain(user: UserEntity): EmployeeAccountStatusResponseDto {
    const dto = new EmployeeAccountStatusResponseDto()
    dto.id = user.id
    dto.identifier = user.identifier
    dto.isActive = user.isActive
    return dto
  }
}

export class EmployeeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId!: string

  @ApiProperty({ type: String, nullable: true, example: '198006152005011001' })
  nip!: string | null

  @ApiProperty({ type: String, nullable: true, example: '1234567890123456' })
  nuptk!: string | null

  @ApiProperty({ type: String, nullable: true, format: 'uuid' })
  employmentTypeId!: string | null

  @ApiProperty({ type: () => EmploymentTypeResponseDto, nullable: true })
  employmentType!: EmploymentTypeResponseDto | null

  @ApiProperty({
    type: () => EmployeeUserResponseDto,
    nullable: true,
    description: 'Null when identity-service does not know the account',
  })
  user!: EmployeeUserResponseDto | null

  @ApiProperty({
    type: () => [EmployeePositionResponseDto],
    description:
      'Every assignment on a single record; the primary one only in a list',
  })
  positions!: EmployeePositionResponseDto[]

  static fromDomain(employee: EmployeeWithDetails): EmployeeResponseDto {
    const dto = new EmployeeResponseDto()
    dto.id = employee.id
    dto.userId = employee.userId
    dto.nip = employee.nip ?? null
    dto.nuptk = employee.nuptk ?? null
    dto.employmentTypeId = employee.employmentTypeId ?? null
    dto.employmentType = employee.employmentType
      ? {
          id: employee.employmentType.id,
          code: employee.employmentType.code,
          name: employee.employmentType.name,
        }
      : null
    const user = employee.user as EmployeeWithDetails['user'] | undefined
    dto.user = user
      ? {
          id: user.id,
          identifier: user.identifier,
          isActive: user.isActive,
          profile: user.profile
            ? {
                name: user.profile.name,
                nik: user.profile.nik,
                gender: user.profile.gender,
              }
            : null,
        }
      : null
    dto.positions = (employee.positions ?? []).map((link) =>
      EmployeePositionResponseDto.fromDomain(link),
    )
    return dto
  }
}

export class EmployeeListResponseDto {
  @ApiProperty({ type: () => [EmployeeResponseDto] })
  data!: EmployeeResponseDto[]

  @ApiProperty({ example: { page: 1, limit: 10, total: 50, totalPages: 5 } })
  meta!: PaginationMeta
}

export function toProfileResponse(profile: ProfileEntity): ProfileResponseDto {
  const dto = new ProfileResponseDto()
  dto.id = profile.id
  dto.userId = profile.userId
  dto.name = profile.name
  dto.nik = profile.nik
  dto.gender = UserGender[profile.gender]
  dto.birthPlace = profile.birthPlace
  dto.birthDate = new Date(profile.birthDate).toISOString()
  dto.email = profile.email ?? null
  dto.phone = profile.phone ?? null
  return dto
}
