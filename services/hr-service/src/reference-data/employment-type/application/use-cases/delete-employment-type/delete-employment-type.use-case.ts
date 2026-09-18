import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { EmploymentTypeEntity } from '../../../domain/entities/employment-type.entity.js'
import { IEmploymentTypeRepository } from '../../../domain/repositories/employment-type.repository.js'

@Injectable()
export class DeleteEmploymentTypeUseCase {
  private readonly logger = new Logger(DeleteEmploymentTypeUseCase.name)

  constructor(
    private readonly employmentTypeRepository: IEmploymentTypeRepository,
  ) {}

  async execute(id: string): Promise<EmploymentTypeEntity> {
    const existing = await this.employmentTypeRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Employment type with ID ${id} not found`)
    }

    const inUseCount =
      await this.employmentTypeRepository.countEmployeesWithEmploymentType(id)
    if (inUseCount > 0) {
      throw new ConflictException(
        `Employment type is in use by ${inUseCount} employees and cannot be deleted`,
      )
    }

    const deleted = await this.employmentTypeRepository.remove(id)
    this.logger.log(`Employment type deleted: ${id}`)
    return deleted
  }
}
