import { Injectable, NotFoundException } from '@nestjs/common'
import { IConditionRepository } from '../../../domain/repositories/condition.repository.js'
import { UpdateConditionInput } from './update-condition.input.js'

@Injectable()
export class UpdateConditionUseCase {
  constructor(private readonly conditionRepository: IConditionRepository) {}

  async execute(id: string, input: UpdateConditionInput) {
    const condition = await this.conditionRepository.findById(id)
    if (!condition) {
      throw new NotFoundException(`Condition with ID ${id} not found`)
    }
    return this.conditionRepository.update(id, {
      code: input.code,
      name: input.name,
      isUsable: input.isUsable ?? true,
    })
  }
}
