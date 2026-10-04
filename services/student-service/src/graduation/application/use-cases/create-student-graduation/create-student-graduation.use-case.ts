import { ConflictException, Injectable } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'
import type { CreateStudentGraduationInput } from './create-student-graduation.input.js'

@Injectable()
export class CreateStudentGraduationUseCase {
  constructor(private readonly graduationRepository: IGraduationRepository) {}
  async execute(input: CreateStudentGraduationInput) {
    const existing = await this.graduationRepository.findByStudentId(
      input.studentId,
    )
    if (existing) {
      throw new ConflictException('Student already has a graduation record')
    }
    const { graduationDate, ...rest } = input
    return this.graduationRepository.create({
      ...rest,
      ...(graduationDate !== undefined && {
        graduationDate: new Date(graduationDate),
      }),
    })
  }
}
