import { Injectable } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'
import type { GetStudentGraduationsInput } from './get-student-graduations.input.js'

@Injectable()
export class GetStudentGraduationsUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute(query: GetStudentGraduationsInput) {
    return this.graduationRepository.findAll({
      page: query.page,
      limit: query.limit,
      academicYearId: query.academicYearId,
      search: query.search,
    })
  }
}
