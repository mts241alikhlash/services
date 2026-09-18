import { Injectable, NotFoundException } from '@nestjs/common'
import { EmploymentTypeEntity } from '../../../domain/entities/employment-type.entity.js'
import { IEmploymentTypeRepository } from '../../../domain/repositories/employment-type.repository.js'

@Injectable()
export class GetEmploymentTypeByIdUseCase {
  constructor(
    private readonly employmentTypeRepository: IEmploymentTypeRepository,
  ) {}

  async execute(id: string): Promise<EmploymentTypeEntity> {
    const type = await this.employmentTypeRepository.findById(id)
    if (!type) {
      throw new NotFoundException(`Employment type with ID ${id} not found`)
    }
    return type
  }
}
