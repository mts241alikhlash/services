import { Injectable } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class LookupAccountUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(identifier?: string, nik?: string) {
    return this.userRepository.lookupAccount({ identifier, nik })
  }
}
