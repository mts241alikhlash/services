import { Injectable } from '@nestjs/common'
import { IConditionRepository } from '../../../domain/repositories/condition.repository.js'
import { CreateConditionInput } from './create-condition.input.js'

@Injectable()
export class CreateConditionUseCase {
  constructor(private readonly conditionRepository: IConditionRepository) {}

  async execute(input: CreateConditionInput) {
    return this.conditionRepository.create({
      code: input.code,
      name: input.name,
      isUsable: input.isUsable ?? true,
    })
  }
}
