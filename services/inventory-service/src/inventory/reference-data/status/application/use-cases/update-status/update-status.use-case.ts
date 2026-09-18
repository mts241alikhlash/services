import { Injectable, NotFoundException } from '@nestjs/common'
import { IStatusRepository } from '../../../domain/repositories/status.repository.js'
import { UpdateStatusInput } from './update-status.input.js'

@Injectable()
export class UpdateStatusUseCase {
  constructor(private readonly statusRepository: IStatusRepository) {}

  async execute(id: string, input: UpdateStatusInput) {
    const status = await this.statusRepository.findById(id)
    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`)
    }
    return this.statusRepository.update(id, {
      code: input.code,
      name: input.name,
      allowTransactions: input.allowTransactions ?? true,
      systemKey: input.systemKey !== undefined ? input.systemKey : undefined,
    })
  }
}
