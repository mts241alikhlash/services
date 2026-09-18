import { Injectable } from '@nestjs/common'
import { StudentParentQueryInput } from './get-student-parents-list.input.js'
import { IStudentParentRepository } from '../../../domain/repositories/student-parent.repository.js'
import { StudentParentWithDetails } from '../../../domain/repositories/student-parent.repository.js'
import { PaginatedResponse } from '../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class GetStudentParentsListUseCase {
  constructor(
    private readonly studentParentRepository: IStudentParentRepository,
  ) {}

  async execute(
    query: StudentParentQueryInput,
  ): Promise<PaginatedResponse<StudentParentWithDetails>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const items = await this.studentParentRepository.findAll(
      query.studentId ?? '',
    )
    const total = items.length
    const data = items.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    }
  }
}
