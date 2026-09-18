import { Injectable } from '@nestjs/common'
import { StudentQueryInput } from './get-students.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { StudentWithDetails } from '../../../domain/repositories/student.repository.js'
import { PaginatedResponse } from '../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class GetStudentsUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(
    query: StudentQueryInput,
  ): Promise<PaginatedResponse<StudentWithDetails>> {
    const { data, total, page, limit } = await this.studentRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      semesterId: query.semesterId,
      classroomId: query.classroomId,
      status: query.status,
      isActive: query.isActive,
    })
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
