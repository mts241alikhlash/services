import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { ISchoolUnitAddressRepository } from '../../../domain/repositories/school-unit-address.repository.js'
import {
  AddressEntity,
  CreateAddressRepositoryInput,
  UpdateAddressRepositoryInput,
} from '../../../../shared/domain/entities/address.entity.js'

@Injectable()
export class PrismaSchoolUnitAddressRepository extends ISchoolUnitAddressRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findBySchoolUnitId(
    schoolUnitId: string,
  ): Promise<AddressEntity | null> {
    return this.prisma.address.findFirst({
      where: { schoolUnitId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
    })
  }

  async create(
    schoolUnitId: string,
    input: CreateAddressRepositoryInput,
  ): Promise<AddressEntity> {
    return this.prisma.address.create({
      data: {
        street: input.street,
        rt: input.rt,
        rw: input.rw,
        village: input.village,
        district: input.district,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude,
        isPrimary: true,
        schoolUnitId,
      },
    })
  }

  async update(
    id: string,
    input: UpdateAddressRepositoryInput,
  ): Promise<AddressEntity> {
    return this.prisma.address.update({
      where: { id },
      data: {
        street: input.street,
        rt: input.rt,
        rw: input.rw,
        village: input.village,
        district: input.district,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    })
  }

  async softDelete(id: string): Promise<AddressEntity> {
    return this.prisma.address.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
