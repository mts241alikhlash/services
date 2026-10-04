import { Injectable, NotFoundException } from '@nestjs/common'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class GetEmployeeByIdUseCase {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(id: string) {
    const employee = await this.employeeRepository.findById(id)
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`)
    }
    return employee
  }
}
