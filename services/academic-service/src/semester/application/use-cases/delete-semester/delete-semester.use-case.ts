import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'

@Injectable()
export class DeleteSemesterUseCase {
  private readonly logger = new Logger(DeleteSemesterUseCase.name)

  constructor(private readonly semesterRepository: ISemesterRepository) {}

  async execute(id: string): Promise<void> {
    const semester = await this.semesterRepository.findById(id)
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`)
    }

    if (semester.isActive) {
      throw new BadRequestException(
        'Cannot delete an active semester. Deactivate it first.',
      )
    }

    const dependent = await this.semesterRepository.findFirstDependent(id)
    if (dependent) {
      throw new BadRequestException(
        `Cannot delete a semester that has ${dependent}.`,
      )
    }

    await this.semesterRepository.softDelete(id)
    this.logger.log(`Semester soft-deleted: ${id}`)
  }
}
