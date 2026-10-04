import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ISemesterTypeRepository,
  SemesterType,
} from '../../../domain/repositories/semester-type.repository.js'
import type { UpdateSemesterTypeInput } from './update-semester-type.input.js'

@Injectable()
export class UpdateSemesterTypeUseCase {
  constructor(
    private readonly semesterTypeRepository: ISemesterTypeRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateSemesterTypeInput,
  ): Promise<SemesterType> {
    const existing = await this.semesterTypeRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Semester Type with ID ${id} not found`)
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.semesterTypeRepository.findByName(input.name)
      if (duplicate) {
        throw new ConflictException(
          `Semester Type with name "${input.name}" already exists`,
        )
      }
    }

    return this.semesterTypeRepository.update(id, {
      name: input.name,
      sequence: input.sequence,
      isActive: input.isActive,
    })
  }
}
