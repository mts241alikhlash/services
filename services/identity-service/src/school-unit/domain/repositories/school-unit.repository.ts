import { SchoolUnitStatus } from '../../../shared/domain/enums/school-unit-status.enum.js'
import { SchoolUnitWithDetails } from '../entities/school-unit.entity.js'

export type { SchoolUnitWithDetails }

export interface SchoolUnitRepositoryInput {
  typeId?: string | null
  name?: string
  surname?: string
  nsm?: string
  npsn?: string
  status?: `${SchoolUnitStatus}`
  npwp?: string
  phone?: string
  email?: string
  website?: string
  isActive?: boolean
}

export abstract class ISchoolUnitRepository {
  abstract findFirst(): Promise<SchoolUnitWithDetails | null>
  abstract findById(id: string): Promise<SchoolUnitWithDetails | null>
  abstract create(
    input: SchoolUnitRepositoryInput,
  ): Promise<SchoolUnitWithDetails>
  abstract update(
    id: string,
    input: SchoolUnitRepositoryInput,
  ): Promise<SchoolUnitWithDetails>
}
