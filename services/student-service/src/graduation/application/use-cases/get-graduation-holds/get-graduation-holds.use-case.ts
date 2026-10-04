import { Injectable } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'

@Injectable()
export class GetGraduationHoldsUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute(academicYearId?: string) {
    return this.graduationRepository.findHolds(academicYearId)
  }
}
