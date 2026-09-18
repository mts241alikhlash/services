import { Injectable, NotFoundException } from '@nestjs/common'
import { SemesterWithDetails } from '../../../domain/entities/semester.entity.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'

@Injectable()
export class GetSemesterByIdUseCase {
  constructor(private readonly semesterRepository: ISemesterRepository) {}

  async execute(id: string): Promise<SemesterWithDetails> {
    const semester = await this.semesterRepository.findById(id)
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`)
    }
    return semester
  }
}
