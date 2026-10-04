import { Injectable } from '@nestjs/common'
import { IClassroomRepository } from '../../../domain/repositories/classroom.repository.js'
import { withDisplayName } from '../../../../shared/utils/classroom-display-name.helper.js'
import type { GetClassroomsInput } from './get-classrooms.input.js'

@Injectable()
export class GetClassroomsUseCase {
  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(input: GetClassroomsInput) {
    const { data, total, page, limit } = await this.classroomRepository.findAll(
      {
        page: input.page,
        limit: input.limit,
        academicYearId: input.academicYearId,
        gradeId: input.gradeId,
        search: input.search,
        isActive: input.isActive,
      },
    )
    return {
      data: data.map(withDisplayName),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
