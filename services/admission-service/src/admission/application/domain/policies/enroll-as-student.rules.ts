import type { ApplicationWithParentsAndUser } from '../repositories/admission-application-repository.js'

interface ParentCompletenessFields {
  nik: string | null
  birthPlace: string | null
  birthDate: Date | null
  occupationId: string | null
}

export function isEligibleAdmissionParent<T extends ParentCompletenessFields>(
  parent: T,
): parent is T & {
  nik: string
  birthPlace: string
  birthDate: Date
  occupationId: string
} {
  return Boolean(
    parent.nik && parent.birthPlace && parent.birthDate && parent.occupationId,
  )
}

type AddressCompletenessFields = Pick<
  ApplicationWithParentsAndUser,
  'street' | 'rt' | 'rw' | 'village' | 'district' | 'city' | 'province'
>

export function hasCompleteAddress<T extends AddressCompletenessFields>(
  application: T,
): application is T & {
  street: string
  rt: string
  rw: string
  village: string
  district: string
  city: string
  province: string
} {
  return Boolean(
    application.street &&
    application.rt &&
    application.rw &&
    application.village &&
    application.district &&
    application.city &&
    application.province,
  )
}
