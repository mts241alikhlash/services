import { Injectable, Logger } from '@nestjs/common'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name)

  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(sessionId: string): Promise<void> {
    const session = await this.authRepository.findSessionWithUser(sessionId)
    const root = session?.parentSessionId ?? sessionId
    const { count } = await this.authRepository.revokeSessionFamily(root)
    this.logger.log(`Session family ${root} revoked (${count})`)
  }
}
