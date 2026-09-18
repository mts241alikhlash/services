import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { UpdateCurriculumSubjectInput } from './update-curriculum-subject.input.js'

@Injectable()
export class UpdateCurriculumSubjectUseCase {
  constructor(
    private readonly curriculumSubjectRepository: ICurriculumSubjectRepository,
  ) {}

  async execute(id: string, input: UpdateCurriculumSubjectInput) {
    const current = await this.curriculumSubjectRepository.findById(id)
    if (!current)
      throw new NotFoundException(`CurriculumSubject with ID ${id} not found`)

    const curriculumId =
      input.curriculumId ?? current.curriculumId ?? current.curriculaId ?? ''
    const subjectId = input.subjectId ?? current.subjectId

    if (
      curriculumId !== current.curriculumId ||
      subjectId !== current.subjectId
    ) {
      const duplicate = await this.curriculumSubjectRepository.findDuplicate(
        curriculumId,
        subjectId,
        id,
      )
      if (duplicate)
        throw new ConflictException(
          'This subject is already assigned to this curriculum',
        )
    }

    return this.curriculumSubjectRepository.update(id, {
      curriculumId: input.curriculumId,
      subjectId: input.subjectId,
      hoursPerWeek: input.hoursPerWeek,
      passingScore: input.passingScore,
    })
  }
}
