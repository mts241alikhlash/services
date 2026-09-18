import { Injectable, NotFoundException } from '@nestjs/common'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class ToggleEmployeeActiveUseCase {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(id: string, isActive: boolean) {
    const employee = await this.employeeRepository.findById(id)
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`)
    }
    return this.employeeRepository.toggleUserActive(employee.user.id, isActive)
  }
}
