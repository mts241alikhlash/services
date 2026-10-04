import { Injectable } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class GetUserSummaryUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute() {
    return this.userRepository.summarise()
  }
}
