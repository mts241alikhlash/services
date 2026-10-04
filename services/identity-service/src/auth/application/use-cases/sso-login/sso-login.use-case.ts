import { ForbiddenException, Injectable } from '@nestjs/common'
import { isStaff } from '../../../domain/policies/sso-apps.policy.js'
import { CentralSessionService } from '../../services/central-session.service.js'
import {
  CredentialsService,
  rolesOf,
} from '../../services/credentials.service.js'
import type { LoginInput } from '../login/login.input.js'

@Injectable()
export class SsoLoginUseCase {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly centralSessions: CentralSessionService,
  ) {}

  async execute(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await this.credentials.verify(input.identifier, input.password)
    if (!isStaff(rolesOf(user))) {
      throw new ForbiddenException('Pendaftar masuk lewat PPDB')
    }
    return this.centralSessions.open(user.id, userAgent, ipAddress)
  }
}
