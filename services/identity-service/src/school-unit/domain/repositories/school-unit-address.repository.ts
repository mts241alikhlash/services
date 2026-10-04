import {
  AddressEntity,
  CreateAddressRepositoryInput,
  UpdateAddressRepositoryInput,
} from '../../../shared/domain/entities/address.entity.js'

export abstract class ISchoolUnitAddressRepository {
  abstract findBySchoolUnitId(
    schoolUnitId: string,
  ): Promise<AddressEntity | null>

  abstract create(
    schoolUnitId: string,
    input: CreateAddressRepositoryInput,
  ): Promise<AddressEntity>

  abstract update(
    id: string,
    input: UpdateAddressRepositoryInput,
  ): Promise<AddressEntity>

  abstract softDelete(id: string): Promise<AddressEntity>
}
