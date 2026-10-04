import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { UpdateMyApplicationDto } from './update-my-application.dto.js'

function failing(body: Record<string, unknown>): string[] {
  return validateSync(plainToInstance(UpdateMyApplicationDto, body)).flatMap(
    (error) => [
      error.property,
      ...(error.children ?? []).flatMap((child) =>
        (child.children ?? []).map(
          (field) => `${child.property}.${field.property}`,
        ),
      ),
    ],
  )
}

describe('UpdateMyApplicationDto', () => {
  it('accepts a sixteen-digit NIK and a ten-digit NISN', () => {
    expect(
      failing({
        nik: '3205010101150001',
        nisn: '0123456789',
        parents: [
          { relation: 'FATHER', name: 'Budi', nik: '3205010101800001' },
        ],
      }),
    ).toEqual([])
  })

  it('refuses a NIK or NISN that is not all digits of the right length', () => {
    expect(
      failing({
        nik: '32050101011500AB',
        nisn: '12345',
        parents: [
          { relation: 'FATHER', name: 'Budi', nik: '320501010180000X' },
        ],
      }),
    ).toEqual(['nik', 'nisn', 'parents', '0.nik'])
  })

  it('takes an Indonesian mobile number, from 08 or +628', () => {
    expect(
      failing({
        phone: '081234567890',
        parents: [
          { relation: 'FATHER', name: 'Budi', phone: '+6281234567890' },
        ],
      }),
    ).toEqual([])
    expect(
      failing({
        phone: '0212345678',
        parents: [{ relation: 'FATHER', name: 'Budi', phone: '0812-3456' }],
      }),
    ).toEqual(['phone', 'parents', '0.phone'])
  })

  it('takes RT and RW of up to three digits, a five-digit postal code and an eight-digit NPSN', () => {
    expect(
      failing({
        rt: '1',
        rw: '012',
        postalCode: '44151',
        previousSchoolNpsn: '20212345',
        parents: [
          {
            relation: 'FATHER',
            name: 'Budi',
            rt: '003',
            rw: '4',
            postalCode: '44152',
          },
        ],
      }),
    ).toEqual([])
    expect(
      failing({
        rt: '01/02',
        rw: '1234',
        postalCode: '4415',
        previousSchoolNpsn: 'MI-123',
        parents: [
          { relation: 'FATHER', name: 'Budi', rt: 'a', postalCode: '441511' },
        ],
      }),
    ).toEqual([
      'rt',
      'rw',
      'postalCode',
      'previousSchoolNpsn',
      'parents',
      '0.rt',
      '0.postalCode',
    ])
  })

  it('asks an achievement for its field, level and rank and a scholarship for its category, provider and provider type', () => {
    const errors = validateSync(
      plainToInstance(UpdateMyApplicationDto, {
        achievements: [{ year: 2026, competitionName: 'OSN' }],
        scholarships: [{ year: 2026, scholarshipName: 'PIP' }],
      }),
    )
    const fields = errors.flatMap((error) =>
      (error.children ?? []).flatMap((row) =>
        (row.children ?? []).map(
          (field) => `${error.property}.${field.property}`,
        ),
      ),
    )
    expect(fields).toEqual([
      'achievements.competitionFieldId',
      'achievements.competitionLevelId',
      'achievements.rank',
      'scholarships.categoryId',
      'scholarships.providerName',
      'scholarships.providerTypeId',
    ])
  })
})
