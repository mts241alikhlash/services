import { Injectable } from '@nestjs/common'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'
import type { GetClassroomSupervisorsInput } from './get-classroom-supervisors.input.js'

@Injectable()
export class GetClassroomSupervisorsUseCase {
  constructor(
    private readonly classroomSupervisorRepository: IClassroomSupervisorRepository,
  ) {}

  async execute(input: GetClassroomSupervisorsInput) {
    const { data, total, page, limit } =
      await this.classroomSupervisorRepository.findAll({
        page: input.page,
        limit: input.limit,
        classroomId: input.classroomId,
        employeeId: input.employeeId,
        semesterId: input.semesterId,
      })
    const totalPages = Math.ceil(total / limit)
    return { data, meta: { page, limit, total, totalPages } }
  }
}
