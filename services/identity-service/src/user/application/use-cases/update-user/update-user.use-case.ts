import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UpdateUserInput } from './update-user.input.js'
import {
  IUserRepository,
  UpdateUserRepositoryInput,
} from '../../../domain/repositories/user.repository.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'

@Injectable()
export class UpdateUserUseCase {
  private readonly logger = new Logger(UpdateUserUseCase.name)

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput) {
    const currentUser = await this.userRepository.findById(id)
    if (!currentUser) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    if (input.identifier && input.identifier !== currentUser.identifier) {
      const existing = await this.userRepository.findByIdentifier(
        input.identifier,
      )
      if (existing) {
        throw new ConflictException(
          `Identifier ${input.identifier} is already in use`,
        )
      }
    }

    const data: UpdateUserRepositoryInput = {}

    if (input.identifier) {
      data.identifier = input.identifier
    }

    if (input.password) {
      data.passwordHash = await hashPassword(input.password)
    }

    const updated = await this.userRepository.update(id, data)
    this.logger.log(`User updated: ${id}`)
    return updated
  }
}
