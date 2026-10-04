import { Injectable } from '@nestjs/common'
import { IStatusRepository } from '../../../domain/repositories/status.repository.js'

@Injectable()
export class GetStatusesUseCase {
  constructor(private readonly statusRepository: IStatusRepository) {}

  async execute(search?: string) {
    return this.statusRepository.findMany(search)
  }
}
