import { Injectable, NotFoundException } from '@nestjs/common'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string) {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }
}
