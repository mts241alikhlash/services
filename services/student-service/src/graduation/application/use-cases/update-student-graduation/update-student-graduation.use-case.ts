import { Injectable, NotFoundException } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'
import type { UpdateStudentGraduationInput } from './update-student-graduation.input.js'

@Injectable()
export class UpdateStudentGraduationUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute(id: string, input: UpdateStudentGraduationInput) {
    const existing = await this.graduationRepository.findById(id)
    if (!existing) {
      throw new NotFoundException('Graduation record not found')
    }
    const { graduationDate, ...rest } = input
    return this.graduationRepository.update(id, {
      ...rest,
      ...(graduationDate !== undefined && {
        graduationDate: new Date(graduationDate),
      }),
    })
  }
}
