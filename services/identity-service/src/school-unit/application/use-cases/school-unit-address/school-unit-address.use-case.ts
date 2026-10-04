import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  SetAddressInput,
  UpdateAddressInput,
} from './school-unit-address.input.js'
import { ISchoolUnitRepository } from '../../../domain/repositories/school-unit.repository.js'
import { ISchoolUnitAddressRepository } from '../../../domain/repositories/school-unit-address.repository.js'

function assertWholeCoordinate(
  latitude: number | null,
  longitude: number | null,
): void {
  if ((latitude === null) === (longitude === null)) return
  throw new BadRequestException(
    'Latitude and longitude must be provided together, or both left empty.',
  )
}

@Injectable()
export class SchoolUnitAddressUseCase {
  private readonly logger = new Logger(SchoolUnitAddressUseCase.name)

  constructor(
    private readonly schoolUnitRepository: ISchoolUnitRepository,
    private readonly schoolUnitAddressRepository: ISchoolUnitAddressRepository,
  ) {}

  async getAddress() {
    const schoolUnit = await this.requireSchoolUnit()
    return this.schoolUnitAddressRepository.findBySchoolUnitId(schoolUnit.id)
  }

  async setAddress(input: SetAddressInput) {
    const schoolUnit = await this.requireSchoolUnit()
    const existing = await this.schoolUnitAddressRepository.findBySchoolUnitId(
      schoolUnit.id,
    )
    if (existing) {
      throw new ConflictException(
        'School unit address already exists. Use PATCH to update.',
      )
    }

    assertWholeCoordinate(input.latitude ?? null, input.longitude ?? null)

    const address = await this.schoolUnitAddressRepository.create(
      schoolUnit.id,
      {
        street: input.street,
        rt: input.rt,
        rw: input.rw,
        village: input.village,
        district: input.district,
        city: input.city,
        province: input.province,
        country: input.country,
        postalCode: input.postalCode,
        isPrimary: input.isPrimary,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    )
    this.logger.log(`School unit address set`)
    return address
  }

  async updateAddress(input: UpdateAddressInput) {
    const schoolUnit = await this.requireSchoolUnit()
    const existing = await this.schoolUnitAddressRepository.findBySchoolUnitId(
      schoolUnit.id,
    )
    if (!existing) {
      throw new NotFoundException('School unit address has not been set yet')
    }

    assertWholeCoordinate(
      input.latitude !== undefined
        ? input.latitude
        : (existing.latitude ?? null),
      input.longitude !== undefined
        ? input.longitude
        : (existing.longitude ?? null),
    )

    const updated = await this.schoolUnitAddressRepository.update(existing.id, {
      street: input.street,
      rt: input.rt,
      rw: input.rw,
      village: input.village,
      district: input.district,
      city: input.city,
      province: input.province,
      country: input.country,
      postalCode: input.postalCode,
      isPrimary: input.isPrimary,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    this.logger.log(`School unit address updated`)
    return updated
  }

  async removeAddress(): Promise<void> {
    const schoolUnit = await this.requireSchoolUnit()
    const existing = await this.schoolUnitAddressRepository.findBySchoolUnitId(
      schoolUnit.id,
    )
    if (!existing) {
      throw new NotFoundException('School unit address has not been set yet')
    }

    await this.schoolUnitAddressRepository.softDelete(existing.id)
    this.logger.log(`School unit address removed`)
  }

  private async requireSchoolUnit() {
    const schoolUnit = await this.schoolUnitRepository.findFirst()
    if (!schoolUnit) {
      throw new NotFoundException('School unit has not been set up yet')
    }
    return schoolUnit
  }
}
