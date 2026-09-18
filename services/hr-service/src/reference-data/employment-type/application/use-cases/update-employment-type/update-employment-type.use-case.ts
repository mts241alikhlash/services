import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EmploymentTypeEntity } from '../../../domain/entities/employment-type.entity.js'
import { IEmploymentTypeRepository } from '../../../domain/repositories/employment-type.repository.js'
import type { UpdateEmploymentTypeInput } from './update-employment-type.input.js'

@Injectable()
export class UpdateEmploymentTypeUseCase {
  private readonly logger = new Logger(UpdateEmploymentTypeUseCase.name)

  constructor(
    private readonly employmentTypeRepository: IEmploymentTypeRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateEmploymentTypeInput,
  ): Promise<EmploymentTypeEntity> {
    const existing = await this.employmentTypeRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Employment type with ID ${id} not found`)
    }

    const type = await this.employmentTypeRepository.update(id, {
      name: input.name,
    })
    this.logger.log(`Employment type updated: ${id}`)
    return type
  }
}
