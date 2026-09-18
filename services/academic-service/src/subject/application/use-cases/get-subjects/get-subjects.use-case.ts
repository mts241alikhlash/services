import { Injectable } from '@nestjs/common'
import { GetSubjectsInput } from './get-subjects.input.js'
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.js'

@Injectable()
export class GetSubjectsUseCase {
  constructor(private readonly subjectRepository: ISubjectRepository) {}

  async execute(input: GetSubjectsInput) {
    const { data, total, page, limit } = await this.subjectRepository.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
    })
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
