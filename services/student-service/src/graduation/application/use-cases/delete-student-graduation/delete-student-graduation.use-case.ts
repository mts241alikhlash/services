import { Injectable, NotFoundException } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'

@Injectable()
export class DeleteStudentGraduationUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute(id: string) {
    const existing = await this.graduationRepository.findById(id)
    if (!existing) {
      throw new NotFoundException('Graduation record not found')
    }
    return this.graduationRepository.softDelete(id)
  }
}
