import { Injectable, NotFoundException } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'

@Injectable()
export class GetStudentGraduationByIdUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute(id: string) {
    const graduation = await this.graduationRepository.findById(id)
    if (!graduation) {
      throw new NotFoundException('Graduation record not found')
    }
    return graduation
  }
}
