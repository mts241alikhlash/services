import { Injectable } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'

@Injectable()
export class GetGraduationCandidatesUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute() {
    return this.graduationRepository.findCandidates()
  }
}
