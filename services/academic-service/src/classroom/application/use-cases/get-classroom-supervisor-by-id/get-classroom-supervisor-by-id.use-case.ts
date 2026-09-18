import { Injectable, NotFoundException } from '@nestjs/common'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'

@Injectable()
export class GetClassroomSupervisorByIdUseCase {
  constructor(
    private readonly classroomSupervisorRepository: IClassroomSupervisorRepository,
  ) {}

  async execute(id: string) {
    const supervisor = await this.classroomSupervisorRepository.findById(id)
    if (!supervisor)
      throw new NotFoundException(`ClassSupervisor with ID ${id} not found`)
    return supervisor
  }
}
