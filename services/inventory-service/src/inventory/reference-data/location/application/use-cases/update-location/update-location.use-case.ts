import { Injectable, NotFoundException } from '@nestjs/common'
import { ILocationRepository } from '../../../domain/repositories/location.repository.js'
import { UpdateLocationInput } from './update-location.input.js'

@Injectable()
export class UpdateLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(id: string, input: UpdateLocationInput) {
    const location = await this.locationRepository.findById(id)
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`)
    }
    return this.locationRepository.update(id, {
      code: input.code,
      name: input.name,
      building: input.building ?? null,
      room: input.room ?? null,
      rack: input.rack ?? null,
      description: input.description ?? null,
    })
  }
}
