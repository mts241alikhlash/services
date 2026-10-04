import { BadRequestException } from '@nestjs/common'
import type { RegionRef } from '../../../../platform/region-lookup/region-lookup.port.js'

export interface RegionCodes {
  provinceCode?: string | null
  regencyCode?: string | null
  districtCode?: string | null
  villageCode?: string | null
}

export interface ResolvedRegion {
  provinceCode: string | null
  regencyCode: string | null
  districtCode: string | null
  villageCode: string | null
  province: string | null
  city: string | null
  district: string | null
  village: string | null
}

const LEVELS = [
  {
    code: 'provinceCode',
    level: 'PROVINCE',
    parentLabel: null,
    notUnder: null,
    label: 'provinsi',
  },
  {
    code: 'regencyCode',
    level: 'REGENCY',
    parentLabel: 'provinsi',
    notUnder: 'Kabupaten/Kota tidak berada di provinsi yang dipilih',
    label: 'kabupaten/kota',
  },
  {
    code: 'districtCode',
    level: 'DISTRICT',
    parentLabel: 'kabupaten/kota',
    notUnder: 'Kecamatan tidak berada di kabupaten/kota yang dipilih',
    label: 'kecamatan',
  },
  {
    code: 'villageCode',
    level: 'VILLAGE',
    parentLabel: 'kecamatan',
    notUnder: 'Desa/Kelurahan tidak berada di kecamatan yang dipilih',
    label: 'desa/kelurahan',
  },
] as const

export function resolveRegion(
  codes: RegionCodes,
  found: RegionRef[],
): ResolvedRegion {
  const byCode = new Map(found.map((row) => [row.code, row]))
  const names: (string | null)[] = []
  const chosen: (string | null)[] = []
  let previous: RegionRef | null = null

  for (const step of LEVELS) {
    const code = codes[step.code] || null
    if (!code) {
      names.push(null)
      chosen.push(null)
      previous = null
      continue
    }
    if (step.parentLabel && chosen[chosen.length - 1] === null) {
      throw new BadRequestException(`Pilih ${step.parentLabel} terlebih dahulu`)
    }
    const row = byCode.get(code)
    if (!row) {
      throw new BadRequestException(`Kode wilayah tidak dikenal: ${code}`)
    }
    if (row.level !== step.level) {
      throw new BadRequestException('Tingkat wilayah tidak sesuai')
    }
    if (previous && row.parentCode !== previous.code) {
      throw new BadRequestException(step.notUnder)
    }
    names.push(row.name)
    chosen.push(code)
    previous = row
  }

  return {
    provinceCode: chosen[0],
    regencyCode: chosen[1],
    districtCode: chosen[2],
    villageCode: chosen[3],
    province: names[0],
    city: names[1],
    district: names[2],
    village: names[3],
  }
}
