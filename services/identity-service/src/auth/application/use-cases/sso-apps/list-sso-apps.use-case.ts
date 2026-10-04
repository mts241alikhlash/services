import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  canOpenApp,
  parseSsoApps,
  SSO_APP_LABELS,
} from '../../../domain/policies/sso-apps.policy.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'

export interface SsoAppView {
  key: string
  label: string
  url: string
}

@Injectable()
export class ListSsoAppsUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(userId: string): Promise<SsoAppView[]> {
    const grants = await this.authRepository.findGrants(userId)
    const apps = parseSsoApps(this.config.getOrThrow<string>('SSO_APPS'))
    return [...apps]
      .filter(([key]) => key !== 'account' && canOpenApp(key, grants))
      .map(([key, callback]) => ({
        key,
        label: SSO_APP_LABELS[key],
        url: new URL(callback).origin,
      }))
  }
}
