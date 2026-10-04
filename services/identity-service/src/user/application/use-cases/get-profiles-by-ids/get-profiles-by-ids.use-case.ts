import { Injectable } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class GetProfilesByIdsUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userIds: string[]) {
    return this.userRepository.findProfilesByUserIds(userIds)
  }
}
