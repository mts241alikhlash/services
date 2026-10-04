import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ChangePasswordInput } from './change-password.input.js'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { PasswordManagerService } from '../../services/password-manager.service.js'

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly passwordManagerService: PasswordManagerService,
  ) {}

  async execute(
    userId: string,
    currentSessionId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account has no password to change — it signs in through Google.',
      )
    }

    const isCurrentValid = await this.passwordManagerService.validatePassword(
      input.currentPassword,
      user.passwordHash,
    )
    if (!isCurrentValid) {
      throw new BadRequestException('Password saat ini salah')
    }

    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException(
        'New password must differ from the current one',
      )
    }

    const newPasswordHash = await this.passwordManagerService.hashPassword(
      input.newPassword,
    )

    await this.authRepository.updateUserPassword(userId, newPasswordHash)
    await this.authRepository.revokeAllOtherUserSessions(
      userId,
      currentSessionId,
    )
  }
}
