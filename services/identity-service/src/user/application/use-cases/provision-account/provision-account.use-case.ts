import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { ProvisionAccountInput } from './provision-account.input.js'
import {
  IUserRepository,
  ProvisionAccountRepositoryInput,
  ProvisionedAccount,
} from '../../../domain/repositories/user.repository.js'

@Injectable()
export class ProvisionAccountUseCase {
  private readonly logger = new Logger(ProvisionAccountUseCase.name)

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ProvisionAccountInput): Promise<ProvisionedAccount> {
    const taken = await this.userRepository.existsByIdentifier(input.identifier)
    if (taken) {
      throw new ConflictException(
        `Identifier ${input.identifier} already in use`,
      )
    }

    const repositoryInput: ProvisionAccountRepositoryInput = {
      identifier: input.identifier,
      passwordHash: input.passwordHash,
      roleCode: input.roleCode,
      ...(input.profile && {
        profile: {
          ...input.profile,
          birthDate: new Date(input.profile.birthDate),
        },
      }),
    }

    const account = await this.userRepository.provisionAccount(repositoryInput)

    this.logger.log(`Account provisioned for ${input.identifier}`)
    return account
  }
}
