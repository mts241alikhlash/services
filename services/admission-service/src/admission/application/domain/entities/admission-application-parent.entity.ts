import { ParentRelation } from '../../../../shared/domain/enums/parent-relation.enum.js'

export interface OccupationRef {
  id: string
  name: string
}

export interface EducationRef {
  id: string
  name: string
}

export interface AdmissionApplicationParentEntity {
  id: string
  applicationId: string
  relation: `${ParentRelation}`
  name: string
  nik: string | null
  birthPlace: string | null
  birthDate: Date | null
  phone: string | null
  occupationId: string | null
  educationId: string | null
  incomeRangeId: string | null
  lifeStatusId: string | null
  domicileId: string | null
  residenceId: string | null
  sameAddressAsStudent: boolean
  street: string | null
  rt: string | null
  rw: string | null
  village: string | null
  district: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  provinceCode: string | null
  regencyCode: string | null
  districtCode: string | null
  villageCode: string | null
  isPrimary: boolean
  occupation?: OccupationRef | null
  education?: EducationRef | null
  createdAt?: Date
  updatedAt?: Date
}
