import { Injectable } from '@nestjs/common'
import { GetUsersInput } from './get-users.input.js'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'

@Injectable()
export class GetUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetUsersInput) {
    const { data, total, page, limit } = await this.userRepository.findAll({
      page: input.page,
      limit: input.limit,
      roleCode: input.roleCode,
      search: input.search,
    })

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}
