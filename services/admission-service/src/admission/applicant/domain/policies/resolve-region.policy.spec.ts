import { BadRequestException } from '@nestjs/common'
import type { RegionRef } from '../../../../platform/region-lookup/region-lookup.port.js'
import { resolveRegion } from './resolve-region.policy.js'

const PROVINCE: RegionRef = {
  code: '32',
  name: 'JAWA BARAT',
  level: 'PROVINCE',
  parentCode: null,
}
const REGENCY: RegionRef = {
  code: '32.04',
  name: 'KAB. BANDUNG',
  level: 'REGENCY',
  parentCode: '32',
}
const DISTRICT: RegionRef = {
  code: '32.04.10',
  name: 'SOREANG',
  level: 'DISTRICT',
  parentCode: '32.04',
}
const VILLAGE: RegionRef = {
  code: '32.04.10.2001',
  name: 'PARUNGSERAB',
  level: 'VILLAGE',
  parentCode: '32.04.10',
}
const OTHER_VILLAGE: RegionRef = {
  code: '32.05.01.2001',
  name: 'DESA LAIN',
  level: 'VILLAGE',
  parentCode: '32.05.01',
}
const ALL = [PROVINCE, REGENCY, DISTRICT, VILLAGE, OTHER_VILLAGE]

describe('resolveRegion', () => {
  it('names a full valid chain', () => {
    expect(
      resolveRegion(
        {
          provinceCode: '32',
          regencyCode: '32.04',
          districtCode: '32.04.10',
          villageCode: '32.04.10.2001',
        },
        ALL,
      ),
    ).toEqual({
      provinceCode: '32',
      regencyCode: '32.04',
      districtCode: '32.04.10',
      villageCode: '32.04.10.2001',
      province: 'JAWA BARAT',
      city: 'KAB. BANDUNG',
      district: 'SOREANG',
      village: 'PARUNGSERAB',
    })
  })

  it('gives all nulls when every code is absent or empty', () => {
    const nulls = {
      provinceCode: null,
      regencyCode: null,
      districtCode: null,
      villageCode: null,
      province: null,
      city: null,
      district: null,
      village: null,
    }
    expect(resolveRegion({}, [])).toEqual(nulls)
    expect(resolveRegion({ provinceCode: '', villageCode: null }, [])).toEqual(
      nulls,
    )
  })

  it('names a province alone and leaves the lower levels null', () => {
    expect(resolveRegion({ provinceCode: '32' }, ALL)).toEqual({
      provinceCode: '32',
      regencyCode: null,
      districtCode: null,
      villageCode: null,
      province: 'JAWA BARAT',
      city: null,
      district: null,
      village: null,
    })
  })

  it('refuses a village that is not under the chosen district', () => {
    expect(() =>
      resolveRegion(
        {
          provinceCode: '32',
          regencyCode: '32.04',
          districtCode: '32.04.10',
          villageCode: '32.05.01.2001',
        },
        ALL,
      ),
    ).toThrow(
      new BadRequestException(
        'Desa/Kelurahan tidak berada di kecamatan yang dipilih',
      ),
    )
  })

  it('refuses an unknown code', () => {
    expect(() => resolveRegion({ provinceCode: '99' }, ALL)).toThrow(
      new BadRequestException('Kode wilayah tidak dikenal: 99'),
    )
  })

  it('refuses a code at the wrong level', () => {
    expect(() => resolveRegion({ provinceCode: '32.04' }, ALL)).toThrow(
      new BadRequestException('Tingkat wilayah tidak sesuai'),
    )
  })

  it('refuses a regency without its province', () => {
    expect(() => resolveRegion({ regencyCode: '32.04' }, ALL)).toThrow(
      new BadRequestException('Pilih provinsi terlebih dahulu'),
    )
  })
})
