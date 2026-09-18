import { Injectable } from '@nestjs/common'
import { IClassroomStructureRepository } from '../../../domain/repositories/classroom-structure.repository.js'
import type { GetClassroomStructuresInput } from './get-classroom-structures.input.js'

@Injectable()
export class GetClassroomStructuresUseCase {
  constructor(
    private readonly classroomStructureRepository: IClassroomStructureRepository,
  ) {}

  async execute(input: GetClassroomStructuresInput) {
    const { data, total, page, limit } =
      await this.classroomStructureRepository.findAll({
        page: input.page,
        limit: input.limit,
        classroomId: input.classroomId,
        semesterId: input.semesterId,
      })
    const totalPages = Math.ceil(total / limit)
    return { data, meta: { page, limit, total, totalPages } }
  }
}
