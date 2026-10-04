import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class DeleteEmployeeUseCase {
  private readonly logger = new Logger(DeleteEmployeeUseCase.name)

  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(id: string): Promise<void> {
    const employee = await this.employeeRepository.findById(id)
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`)
    }

    await this.employeeRepository.softDelete(id, employee.user.id)
    this.logger.log(`Employee soft-deleted: ${id}`)
  }
}
