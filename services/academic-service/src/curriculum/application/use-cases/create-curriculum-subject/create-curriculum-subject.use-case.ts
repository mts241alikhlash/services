import { ConflictException, Injectable } from '@nestjs/common'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { CreateCurriculumSubjectInput } from './create-curriculum-subject.input.js'

@Injectable()
export class CreateCurriculumSubjectUseCase {
  constructor(
    private readonly curriculumSubjectRepository: ICurriculumSubjectRepository,
  ) {}

  async execute(input: CreateCurriculumSubjectInput) {
    const existing = await this.curriculumSubjectRepository.findDuplicate(
      input.curriculumId,
      input.subjectId,
    )
    if (existing) {
      throw new ConflictException(
        'This subject is already assigned to this curriculum',
      )
    }

    const softDeleted = await this.curriculumSubjectRepository.findSoftDeleted(
      input.curriculumId,
      input.subjectId,
    )
    if (softDeleted) {
      return this.curriculumSubjectRepository.restore(softDeleted.id, {
        hoursPerWeek: input.hoursPerWeek,
        passingScore: input.passingScore,
      })
    }

    return this.curriculumSubjectRepository.create({
      curriculumId: input.curriculumId,
      subjectId: input.subjectId,
      hoursPerWeek: input.hoursPerWeek,
      passingScore: input.passingScore,
    })
  }
}
