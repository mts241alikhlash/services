import { Injectable } from '@nestjs/common'
import { IGradeAcademicYearRepository } from '../../../domain/repositories/grade-academic-year.repository.js'
import type { AssignCurriculumToGradeInput } from './assign-curriculum-to-grade.input.js'

@Injectable()
export class AssignCurriculumToGradeUseCase {
  constructor(
    private readonly gradeAcademicYearRepository: IGradeAcademicYearRepository,
  ) {}

  async execute(input: AssignCurriculumToGradeInput) {
    return this.gradeAcademicYearRepository.upsert({
      gradeId: input.gradeId,
      academicYearId: input.academicYearId,
      curriculumId: input.curriculumId,
    })
  }
}
