import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UpdateEmployeeInput } from './update-employee.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class UpdateEmployeeUseCase {
  private readonly logger = new Logger(UpdateEmployeeUseCase.name)

  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(id: string, input: UpdateEmployeeInput) {
    const current = await this.employeeRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Employee with ID ${id} not found`)
    }

    if (input.nip) {
      const existing = await this.employeeRepository.findByNip(input.nip, id)
      if (existing) {
        throw new ConflictException(`NIP "${input.nip}" is already registered`)
      }
    }

    if (input.nuptk) {
      const existing = await this.employeeRepository.findByNuptk(
        input.nuptk,
        id,
      )
      if (existing) {
        throw new ConflictException(
          `NUPTK "${input.nuptk}" is already registered`,
        )
      }
    }

    const updated = await this.employeeRepository.update(id, {
      nip: input.nip,
      nuptk: input.nuptk,
      employmentTypeId: input.employmentTypeId,
    })
    this.logger.log(`Employee updated: ${id}`)
    return updated
  }
}
