import { parentGaps } from './parent-requirements.policy.js'

const names: Record<string, string> = {
  alive: 'Masih hidup',
  dead: 'Meninggal',
  unknown: 'Tidak diketahui',
}
const statusName = (id: string | null) => (id ? names[id] : undefined)

function parent(overrides: Record<string, unknown>) {
  return {
    relation: 'FATHER',
    name: 'Budi',
    nik: '3205010101800001',
    birthPlace: 'Garut',
    birthDate: new Date('1980-01-01'),
    occupationId: 'occ1',
    phone: '081234567890',
    lifeStatusId: 'alive',
    isPrimary: false,
    ...overrides,
  }
}

const father = parent({ isPrimary: true })
const mother = parent({
  relation: 'MOTHER',
  name: 'Siti',
  nik: '3205014101820002',
})

describe('parentGaps', () => {
  it('passes a complete family with the father as guardian', () => {
    expect(
      parentGaps([father, mother], '3205010101140003', statusName),
    ).toEqual([])
  })

  it('names what the guardian still lacks', () => {
    expect(
      parentGaps(
        [
          parent({ isPrimary: true, nik: null, phone: '', occupationId: null }),
          mother,
        ],
        null,
        statusName,
      ),
    ).toEqual(['NIK wali', 'Pekerjaan wali', 'No. HP wali'])
  })

  it('asks for a guardian when nobody is marked', () => {
    expect(parentGaps([parent({}), mother], null, statusName)).toEqual([
      'Wali santri',
    ])
  })

  it('refuses a father or mother as guardian unless alive', () => {
    expect(
      parentGaps(
        [parent({ isPrimary: true, lifeStatusId: 'dead' }), mother],
        null,
        statusName,
      ),
    ).toEqual(['Wali harus ayah/ibu yang masih hidup atau orang lain'])
  })

  it('accepts a separate guardian without a life status', () => {
    expect(
      parentGaps(
        [
          parent({ lifeStatusId: 'dead' }),
          parent({
            relation: 'MOTHER',
            nik: null,
            lifeStatusId: 'unknown',
            name: '',
          }),
          parent({
            relation: 'GUARDIAN',
            nik: '3205010101750004',
            lifeStatusId: null,
            isPrimary: true,
          }),
        ],
        null,
        statusName,
      ),
    ).toEqual([])
  })

  it('asks the NIK of a living father or mother', () => {
    expect(
      parentGaps([father, { ...mother, nik: null }], null, statusName),
    ).toEqual(['NIK ibu'])
  })

  it('refuses a NIK that two people share', () => {
    expect(
      parentGaps(
        [father, { ...mother, nik: father.nik }],
        father.nik,
        statusName,
      ),
    ).toEqual([
      'NIK santri sama dengan NIK ayah',
      'NIK santri sama dengan NIK ibu',
      'NIK ayah sama dengan NIK ibu',
    ])
  })
})
