import { Injectable } from '@nestjs/common'
import { GetEmployeesInput } from './get-employees.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class GetEmployeesUseCase {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(query: GetEmployeesInput) {
    const { data, total, page, limit } = await this.employeeRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      employmentTypeId: query.employmentTypeId,
      academicYearId: query.academicYearId,
      positionCategoryId: query.positionCategoryId,
      isActive: query.isActive,
    })
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
