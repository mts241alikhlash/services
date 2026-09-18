import { Injectable } from '@nestjs/common'
import { ILocationRepository } from '../../../domain/repositories/location.repository.js'

@Injectable()
export class GetLocationsUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(search?: string) {
    return this.locationRepository.findMany(search)
  }
}
