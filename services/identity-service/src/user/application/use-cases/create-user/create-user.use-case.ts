import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { CreateUserInput } from './create-user.input.js'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name)

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput) {
    const taken = await this.userRepository.existsByIdentifier(input.identifier)
    if (taken) {
      throw new ConflictException(
        `Identifier ${input.identifier} already in use`,
      )
    }

    const user = await this.userRepository.create({
      identifier: input.identifier,
      passwordHash: await hashPassword(input.password),
    })

    this.logger.log(`User created: ${input.identifier}`)
    return user
  }
}
