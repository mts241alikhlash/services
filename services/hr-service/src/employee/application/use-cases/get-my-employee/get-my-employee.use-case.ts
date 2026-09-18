import { Injectable, NotFoundException } from '@nestjs/common'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { EmployeeWithDetails } from '../../../domain/entities/employee.entity.js'
import { GetEmployeeByIdUseCase } from '../get-employee-by-id/get-employee-by-id.use-case.js'

@Injectable()
export class GetMyEmployeeUseCase {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly getEmployeeById: GetEmployeeByIdUseCase,
  ) {}

  async execute(userId: string): Promise<EmployeeWithDetails> {
    const employee = await this.employeeRepository.findByUserId(userId)
    if (!employee) {
      throw new NotFoundException('This account has no employee record')
    }
    return this.getEmployeeById.execute(employee.id)
  }
}
