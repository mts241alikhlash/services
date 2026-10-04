import { Injectable, NotFoundException } from '@nestjs/common'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'

@Injectable()
export class DeleteCurriculumSubjectUseCase {
  constructor(
    private readonly curriculumSubjectRepository: ICurriculumSubjectRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.curriculumSubjectRepository.findById(id)
    if (!existing)
      throw new NotFoundException(`CurriculumSubject with ID ${id} not found`)
    return this.curriculumSubjectRepository.softDelete(id)
  }
}
