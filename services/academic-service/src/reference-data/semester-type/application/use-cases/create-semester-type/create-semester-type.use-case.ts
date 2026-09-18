import { ConflictException, Injectable } from '@nestjs/common'
import {
  ISemesterTypeRepository,
  SemesterType,
} from '../../../domain/repositories/semester-type.repository.js'
import type { CreateSemesterTypeInput } from './create-semester-type.input.js'

@Injectable()
export class CreateSemesterTypeUseCase {
  constructor(
    private readonly semesterTypeRepository: ISemesterTypeRepository,
  ) {}

  async execute(input: CreateSemesterTypeInput): Promise<SemesterType> {
    const existing = await this.semesterTypeRepository.findByName(input.name)
    if (existing) {
      throw new ConflictException(
        `Semester Type with name "${input.name}" already exists`,
      )
    }

    return this.semesterTypeRepository.create({
      name: input.name,
      ...(input.sequence !== undefined && { sequence: input.sequence }),
      isActive: input.isActive ?? true,
    })
  }
}
