import { BadRequestException, Injectable } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { ResetPasswordInput } from './reset-password.input.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { PasswordManagerService } from '../../services/password-manager.service.js'

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly passwordManagerService: PasswordManagerService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(input.token)
      .digest('hex')
    const resetToken =
      await this.authRepository.findActivePasswordResetToken(tokenHash)

    if (!resetToken) {
      throw new BadRequestException(
        'Password reset link is invalid or has expired',
      )
    }

    const hashedPassword = await this.passwordManagerService.hashPassword(
      input.newPassword,
    )

    await this.authRepository.updateUserPassword(
      resetToken.userId,
      hashedPassword,
    )
    await this.authRepository.markPasswordResetTokenAsUsed(resetToken.id)

    await this.authRepository.revokeAllOtherUserSessions(resetToken.userId, '')
  }
}
