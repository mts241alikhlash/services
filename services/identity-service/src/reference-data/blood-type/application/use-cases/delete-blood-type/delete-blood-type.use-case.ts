import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IBloodTypeRepository } from '../../../domain/repositories/blood-type.repository.js'

@Injectable()
export class DeleteBloodTypeUseCase {
  private readonly logger = new Logger(DeleteBloodTypeUseCase.name)

  constructor(private readonly repository: IBloodTypeRepository) {}

  async execute(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Blood type not found')
    }

    const inUse = await this.repository.countProfilesUsing(id)
    if (inUse > 0) {
      throw new ConflictException(
        `Blood type '${existing.name}' is recorded on ${inUse} profile(s) and cannot be deleted`,
      )
    }

    await this.repository.softDelete(id)
    this.logger.log(`Blood type deleted: ${existing.name}`)
    return { success: true }
  }
}
