import { Injectable } from '@nestjs/common'
import { ILocationRepository } from '../../../domain/repositories/location.repository.js'
import { CreateLocationInput } from './create-location.input.js'

@Injectable()
export class CreateLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(input: CreateLocationInput) {
    return this.locationRepository.create({
      code: input.code,
      name: input.name,
      building: input.building ?? null,
      room: input.room ?? null,
      rack: input.rack ?? null,
      description: input.description ?? null,
    })
  }
}
