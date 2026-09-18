import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IReligionRepository } from '../../../domain/repositories/religion.repository.js'

@Injectable()
export class DeleteReligionUseCase {
  private readonly logger = new Logger(DeleteReligionUseCase.name)

  constructor(private readonly repository: IReligionRepository) {}

  async execute(id: string) {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Religion not found')
    }

    const inUse = await this.repository.countProfilesUsing(id)
    if (inUse > 0) {
      throw new ConflictException(
        `Religion '${existing.name}' is recorded on ${inUse} profile(s) and cannot be deleted`,
      )
    }

    await this.repository.softDelete(id)
    this.logger.log(`Religion deleted: ${existing.name}`)
    return { success: true }
  }
}
