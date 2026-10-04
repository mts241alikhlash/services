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

const LEGACY_INCOME_BY_RANGE_ID: Record<string, string> = {
  'ad78a84c-a83f-4888-bdc6-7a9bf2f408d9': 'BELOW_500K',
  'ffc9086f-7df5-40ff-8045-95d194c50e5b': 'BETWEEN_500K_1M',
  '861993f5-7504-46e8-b888-359c65a4fc6f': 'BETWEEN_1M_2M',
  '3f2b33e9-269f-4302-9b19-896f634512ce': 'BETWEEN_2M_3M',
  '53f22a40-5c05-41a3-a083-0ccf4bd4a194': 'ABOVE_3M',
}

export function legacyIncomeFor(incomeRangeId: string | null): string | null {
  return (incomeRangeId && LEGACY_INCOME_BY_RANGE_ID[incomeRangeId]) || null
}
