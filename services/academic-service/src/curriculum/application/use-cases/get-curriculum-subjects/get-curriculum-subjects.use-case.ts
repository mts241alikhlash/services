import { Injectable } from '@nestjs/common'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { GetCurriculumSubjectsInput } from './get-curriculum-subjects.input.js'

@Injectable()
export class GetCurriculumSubjectsUseCase {
  constructor(
    private readonly curriculumSubjectRepository: ICurriculumSubjectRepository,
  ) {}

  async execute(input: GetCurriculumSubjectsInput) {
    return this.curriculumSubjectRepository.findAll({
      page: input.page,
      limit: input.limit,
      curriculumId: input.curriculumId,
      subjectId: input.subjectId,
    })
  }
}
