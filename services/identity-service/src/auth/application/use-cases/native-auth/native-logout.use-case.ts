import { Injectable } from '@nestjs/common'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { LogoutUseCase } from '../logout/logout.use-case.js'

@Injectable()
export class NativeLogoutUseCase {
  constructor(
    private readonly tokens: TokenManagerService,
    private readonly logout: LogoutUseCase,
  ) {}

  async execute(input: { refreshToken: string }): Promise<void> {
    let sessionId: string
    try {
      sessionId = (await this.tokens.verifyRefreshToken(input.refreshToken))
        .sessionId
    } catch {
      return
    }
    await this.logout.execute(sessionId)
  }
}
