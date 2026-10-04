import { Injectable, UnauthorizedException } from '@nestjs/common'
import { IAuthRepository } from '../../domain/repositories/auth.repository.js'
import { PasswordManagerService } from './password-manager.service.js'

export function rolesOf(user: {
  userRoles?: { role: { code: string } }[]
}): string[] {
  return user.userRoles?.map((userRole) => userRole.role.code) ?? []
}

@Injectable()
export class CredentialsService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly passwordManagerService: PasswordManagerService,
  ) {}

  async verify(identifier: string, password: string) {
    const user = await this.authRepository.findUserByIdentifier(identifier)
    if (!user || !user.isActive || user.deletedAt || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const isValid = await this.passwordManagerService.validatePassword(
      password,
      user.passwordHash,
    )
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials')
    }
    return user
  }
}
