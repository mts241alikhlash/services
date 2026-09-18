import { Injectable } from '@nestjs/common'
import { IStatusRepository } from '../../../domain/repositories/status.repository.js'
import { CreateStatusInput } from './create-status.input.js'

@Injectable()
export class CreateStatusUseCase {
  constructor(private readonly statusRepository: IStatusRepository) {}

  async execute(input: CreateStatusInput) {
    return this.statusRepository.create({
      code: input.code,
      name: input.name,
      allowTransactions: input.allowTransactions ?? true,
      systemKey: input.systemKey ?? null,
    })
  }
}
