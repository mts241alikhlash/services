import { Injectable, NotFoundException } from '@nestjs/common'
import { IClassroomRepository } from '../../../classroom/domain/repositories/classroom.repository.js'

@Injectable()
export class AssertClassroomsExistService {
  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(ids?: string[]): Promise<void> {
    for (const id of ids ?? []) {
      const classroom = await this.classroomRepository.findById(id)
      if (!classroom) {
        throw new NotFoundException(`Classroom with id ${id} not found`)
      }
    }
  }
}
