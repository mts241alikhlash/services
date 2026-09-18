import { Injectable, NotFoundException } from '@nestjs/common'
import { ITeachingAssignmentRepository } from '../../../domain/repositories/teaching-assignment.repository.js'

@Injectable()
export class DeleteTeachingAssignmentUseCase {
  constructor(
    private readonly teachingAssignmentRepository: ITeachingAssignmentRepository,
  ) {}

  async execute(id: string) {
    const result = await this.teachingAssignmentRepository.findById(id)
    if (!result)
      throw new NotFoundException(`Teaching assignment ${id} not found`)
    return this.teachingAssignmentRepository.softDelete(id)
  }
}
