import { Injectable } from '@nestjs/common'
import { IGradeRepository } from '../../../domain/repositories/grade.repository.js'
import type { GetGradesInput } from './get-grades.input.js'

@Injectable()
export class GetGradesUseCase {
  constructor(private readonly gradeRepository: IGradeRepository) {}

  async execute(input: GetGradesInput) {
    return this.gradeRepository.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
      isActive: input.isActive,
    })
  }
}
