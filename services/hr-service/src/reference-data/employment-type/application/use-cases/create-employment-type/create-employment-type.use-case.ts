import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { EmploymentTypeEntity } from '../../../domain/entities/employment-type.entity.js'
import { IEmploymentTypeRepository } from '../../../domain/repositories/employment-type.repository.js'
import type { CreateEmploymentTypeInput } from './create-employment-type.input.js'

@Injectable()
export class CreateEmploymentTypeUseCase {
  private readonly logger = new Logger(CreateEmploymentTypeUseCase.name)

  constructor(
    private readonly employmentTypeRepository: IEmploymentTypeRepository,
  ) {}

  async execute(
    input: CreateEmploymentTypeInput,
  ): Promise<EmploymentTypeEntity> {
    const existing = await this.employmentTypeRepository.findByCode(input.code)
    if (existing) {
      throw new ConflictException(
        `Employment type code "${input.code}" already exists for this school unit`,
      )
    }

    const type = await this.employmentTypeRepository.create({
      code: input.code,
      name: input.name,
    })
    this.logger.log(`Employment type created: ${type.code}`)
    return type
  }
}
