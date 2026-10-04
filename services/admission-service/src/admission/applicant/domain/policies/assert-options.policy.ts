import { BadRequestException } from '@nestjs/common'
import type { OptionListKey } from '../../../../platform/reference-lookup/option-lists.js'
import type { IReferenceLookupPort } from '../../../../platform/reference-lookup/reference-lookup.port.js'

const OPTION_LABELS: Record<OptionListKey, string> = {
  occupations: 'Pekerjaan',
  educations: 'Pendidikan',
  incomeRanges: 'Penghasilan',
  financingSources: 'Yang membiayai sekolah',
  disabilityTypes: 'Kebutuhan disabilitas',
  specialNeeds: 'Kebutuhan khusus',
  studentResidences: 'Status tempat tinggal',
  parentResidences: 'Status tempat tinggal orang tua',
  transportations: 'Transportasi',
  travelDistances: 'Jarak tempat tinggal',
  travelTimes: 'Waktu tempuh',
  parentLifeStatuses: 'Status orang tua',
  domiciles: 'Domisili',
  scholarshipCategories: 'Kategori beasiswa',
  scholarshipProviderTypes: 'Jenis instansi pemberi beasiswa',
  competitionFields: 'Bidang lomba',
  competitionLevels: 'Tingkat lomba',
}

export type OptionChoices = Partial<
  Record<OptionListKey, string | null | undefined>
>

export interface OptionCheck {
  chosen: OptionChoices
  previous: OptionChoices
}

export async function assertOptions(
  chosen: OptionChoices,
  previous: OptionChoices,
  lookup: IReferenceLookupPort,
): Promise<void> {
  await assertOptionChecks([{ chosen, previous }], lookup)
}

export async function assertOptionChecks(
  checks: OptionCheck[],
  lookup: IReferenceLookupPort,
): Promise<void> {
  const wanted = new Map<OptionListKey, Set<string>>()
  for (const { chosen } of checks) {
    for (const [key, id] of Object.entries(chosen) as [
      OptionListKey,
      string | null | undefined,
    ][]) {
      if (!id) continue
      wanted.set(key, (wanted.get(key) ?? new Set()).add(id))
    }
  }

  const found = new Map<string, { isActive: boolean }>()
  await Promise.all(
    [...wanted].map(async ([key, ids]) => {
      for (const row of await lookup.optionsByIds(key, [...ids])) {
        found.set(`${key}:${row.id}`, row)
      }
    }),
  )

  for (const { chosen, previous } of checks) {
    for (const [key, id] of Object.entries(chosen) as [
      OptionListKey,
      string | null | undefined,
    ][]) {
      if (!id) continue
      const row = found.get(`${key}:${id}`)
      if (!row || (!row.isActive && id !== previous[key])) {
        throw new BadRequestException(
          `Pilihan tidak dikenal atau tidak aktif: ${OPTION_LABELS[key]}`,
        )
      }
    }
  }
}
