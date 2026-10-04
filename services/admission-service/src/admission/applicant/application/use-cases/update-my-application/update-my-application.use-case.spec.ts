import { BadRequestException } from '@nestjs/common'
import type { OptionRef } from '../../../../../platform/reference-lookup/option-lists.js'
import type { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import type {
  IRegionLookupPort,
  RegionRef,
} from '../../../../../platform/region-lookup/region-lookup.port.js'
import type { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import { ParentRelation } from '../../../../../shared/domain/enums/parent-relation.enum.js'
import { UpdateMyApplicationUseCase } from './update-my-application.use-case.js'

const REGIONS: RegionRef[] = [
  { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
  { code: '32.04', name: 'KAB. BANDUNG', level: 'REGENCY', parentCode: '32' },
  {
    code: '32.04.10',
    name: 'SOREANG',
    level: 'DISTRICT',
    parentCode: '32.04',
  },
  {
    code: '32.04.10.2001',
    name: 'PARUNGSERAB',
    level: 'VILLAGE',
    parentCode: '32.04.10',
  },
  { code: '31', name: 'DKI JAKARTA', level: 'PROVINCE', parentCode: null },
]

const CODES = {
  provinceCode: '32',
  regencyCode: '32.04',
  districtCode: '32.04.10',
  villageCode: '32.04.10.2001',
}

const NAMES = {
  province: 'JAWA BARAT',
  city: 'KAB. BANDUNG',
  district: 'SOREANG',
  village: 'PARUNGSERAB',
}

const NO_ADDRESS = {
  street: null,
  rt: null,
  rw: null,
  postalCode: null,
  provinceCode: null,
  regencyCode: null,
  districtCode: null,
  villageCode: null,
  province: null,
  city: null,
  district: null,
  village: null,
}

describe('UpdateMyApplicationUseCase options and addresses', () => {
  let options: Map<string, OptionRef>
  let application: Record<string, unknown>
  let updateMyApplication: jest.Mock
  let countApplicationFiles: jest.Mock
  let optionsByIds: jest.Mock
  let useCase: UpdateMyApplicationUseCase

  beforeEach(() => {
    options = new Map([
      ['field-1', { id: 'field-1', name: 'Sains', isActive: true }],
      ['level-1', { id: 'level-1', name: 'Nasional', isActive: true }],
      ['category-1', { id: 'category-1', name: 'Prestasi', isActive: true }],
      ['category-kip', { id: 'category-kip', name: 'KIP/PIP', isActive: true }],
      ['provider-1', { id: 'provider-1', name: 'Pemerintah', isActive: true }],
      ['active-ojek', { id: 'active-ojek', name: 'Ojek', isActive: true }],
      ['old-delman', { id: 'old-delman', name: 'Delman', isActive: false }],
      ['income-1', { id: 'income-1', name: '< 500rb', isActive: true }],
    ])
    application = { id: 'app1', status: 'DRAFT', parents: [] }
    updateMyApplication = jest.fn().mockResolvedValue({ id: 'app1' })
    countApplicationFiles = jest
      .fn()
      .mockImplementation((_id: string, fileIds: string[]) =>
        Promise.resolve(fileIds.length),
      )
    const repository = {
      findMyDetail: jest.fn().mockImplementation(() => application),
      findDetailById: jest.fn().mockImplementation(() => application),
      updateMyApplication,
      countApplicationFiles,
    } as unknown as IAdmissionApplicantRepository
    optionsByIds = jest
      .fn()
      .mockImplementation((_key: string, ids: string[]) =>
        Promise.resolve(
          ids.flatMap((id) => (options.has(id) ? [options.get(id)!] : [])),
        ),
      )
    const lookup = { optionsByIds } as unknown as IReferenceLookupPort
    const regions = {
      byCodes: jest
        .fn()
        .mockImplementation((codes: string[]) =>
          Promise.resolve(REGIONS.filter((r) => codes.includes(r.code))),
        ),
    } as unknown as IRegionLookupPort
    useCase = new UpdateMyApplicationUseCase(repository, lookup, regions)
  })

  const saved = () => updateMyApplication.mock.calls[0][0]

  it('refuses a newly chosen inactive option', async () => {
    await expect(
      useCase.execute('u1', { transportationId: 'old-delman' }),
    ).rejects.toThrow(
      new BadRequestException(
        'Pilihan tidak dikenal atau tidak aktif: Transportasi',
      ),
    )
    expect(updateMyApplication).not.toHaveBeenCalled()
  })

  it('refuses an option id the list does not know', async () => {
    await expect(
      useCase.execute('u1', { transportationId: 'nope' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('accepts the same inactive option the applicant already saved', async () => {
    application.transportationId = 'old-delman'

    await useCase.execute('u1', { transportationId: 'old-delman' })

    expect(saved().data.transportationId).toBe('old-delman')
  })

  it('refuses an unknown income range on a parent', async () => {
    await expect(
      useCase.execute('u1', {
        parents: [
          {
            relation: ParentRelation.FATHER,
            name: 'Budi',
            incomeRangeId: 'nope',
          },
        ],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Pilihan tidak dikenal atau tidak aktif: Penghasilan',
      ),
    )
  })

  it('accepts an inactive parent option the same parent already holds', async () => {
    options.set('old-income', {
      id: 'old-income',
      name: 'Lama',
      isActive: false,
    })
    application.parents = [
      { relation: ParentRelation.FATHER, incomeRangeId: 'old-income' },
    ]

    await useCase.execute('u1', {
      parents: [
        {
          relation: ParentRelation.FATHER,
          name: 'Budi',
          incomeRangeId: 'old-income',
        },
      ],
    })

    expect(saved().parents[0].incomeRangeId).toBe('old-income')
  })

  it('stores the region names resolved from the codes', async () => {
    await useCase.execute('u1', { ...CODES })

    expect(saved().data).toMatchObject({ ...CODES, ...NAMES })
  })

  it('refuses a village under the wrong district', async () => {
    await expect(
      useCase.execute('u1', {
        ...CODES,
        districtCode: '32.04.10',
        villageCode: '31',
      }),
    ).rejects.toThrow(BadRequestException)
  })

  it('leaves the stored region alone when the payload carries no code', async () => {
    await useCase.execute('u1', { nickname: 'Bud' })

    expect(saved().data).toEqual({ nickname: 'Bud' })
  })

  it('copies the student address to a parent that shares it, after the same save', async () => {
    application = { ...application, street: 'Old Street' }

    await useCase.execute('u1', {
      street: 'Jl. Mawar',
      rt: '01',
      rw: '02',
      postalCode: '40911',
      ...CODES,
      parents: [
        {
          relation: ParentRelation.FATHER,
          name: 'Budi',
          sameAddressAsStudent: true,
        },
      ],
    })

    expect(saved().parents[0]).toMatchObject({
      sameAddressAsStudent: true,
      street: 'Jl. Mawar',
      rt: '01',
      rw: '02',
      postalCode: '40911',
      ...CODES,
      ...NAMES,
    })
  })

  it('copies the stored student address when the payload does not touch it', async () => {
    application = {
      ...application,
      street: 'Jl. Melati',
      rt: '03',
      rw: '04',
      postalCode: '40912',
      ...CODES,
      ...NAMES,
    }

    await useCase.execute('u1', {
      parents: [{ relation: ParentRelation.MOTHER, name: 'Siti' }],
    })

    expect(saved().parents[0]).toMatchObject({
      sameAddressAsStudent: true,
      street: 'Jl. Melati',
      ...CODES,
      ...NAMES,
    })
  })

  it('gives a sharing parent nulls when the student has no address yet', async () => {
    await useCase.execute('u1', {
      parents: [
        {
          relation: ParentRelation.FATHER,
          name: 'Budi',
          sameAddressAsStudent: true,
        },
      ],
    })

    expect(saved().parents[0]).toMatchObject(NO_ADDRESS)
  })

  it('gives a sharing parent only the part of the address the student has', async () => {
    await useCase.execute('u1', {
      provinceCode: '32',
      parents: [
        {
          relation: ParentRelation.FATHER,
          name: 'Budi',
          sameAddressAsStudent: true,
        },
      ],
    })

    expect(saved().parents[0]).toMatchObject({
      ...NO_ADDRESS,
      provinceCode: '32',
      province: 'JAWA BARAT',
    })
  })

  it('settles the guardian: the father keeps the student address, the mother chosen keeps hers, a separate guardian goes', async () => {
    await useCase.execute('u1', {
      street: 'Jl. Melati',
      parents: [
        {
          relation: ParentRelation.FATHER,
          name: 'Ahmad',
          sameAddressAsStudent: true,
        },
        {
          relation: ParentRelation.MOTHER,
          name: 'Siti',
          isPrimary: true,
          sameAddressAsStudent: false,
        },
        {
          relation: ParentRelation.GUARDIAN,
          name: 'Paman',
          sameAddressAsStudent: true,
        },
      ],
    })

    const parents = saved().parents as {
      relation: string
      isPrimary: boolean
      street: string | null
    }[]
    expect(parents.map((p) => [p.relation, p.isPrimary])).toEqual([
      ['FATHER', false],
      ['MOTHER', true],
    ])
    expect(parents[0].street).toBe('Jl. Melati')
    expect(parents[1].street).toBeNull()
  })

  it('resolves the own address of a parent that does not share it', async () => {
    await useCase.execute('u1', {
      parents: [
        {
          relation: ParentRelation.MOTHER,
          name: 'Siti',
          sameAddressAsStudent: false,
          street: 'Jl. Anggrek',
          postalCode: '10110',
          provinceCode: '31',
        },
      ],
    })

    expect(saved().parents[0]).toMatchObject({
      sameAddressAsStudent: false,
      street: 'Jl. Anggrek',
      postalCode: '10110',
      provinceCode: '31',
      province: 'DKI JAKARTA',
      regencyCode: null,
      city: null,
    })
  })

  it('refuses a parent region that skips its province', async () => {
    await expect(
      useCase.execute('u1', {
        parents: [
          {
            relation: ParentRelation.MOTHER,
            name: 'Siti',
            sameAddressAsStudent: false,
            regencyCode: '32.04',
          },
        ],
      }),
    ).rejects.toThrow(new BadRequestException('Pilih provinsi terlebih dahulu'))
  })

  const ACHIEVEMENT = {
    year: 2025,
    competitionName: 'OSN',
    competitionFieldId: 'field-1',
    competitionLevelId: 'level-1',
  }
  const SCHOLARSHIP = {
    year: 2025,
    scholarshipName: 'PIP',
    categoryId: 'category-1',
    providerTypeId: 'provider-1',
    amount: 450000,
  }

  it('hands the achievement and scholarship rows to the repository in order', async () => {
    const second = { ...ACHIEVEMENT, competitionName: 'KSM' }

    await useCase.execute('u1', {
      achievements: [ACHIEVEMENT, second],
      scholarships: [SCHOLARSHIP],
    })

    expect(saved().achievements).toEqual([ACHIEVEMENT, second])
    expect(saved().scholarships).toEqual([{ ...SCHOLARSHIP, kipNumber: null }])
  })

  it('keeps the KIP number of a KIP/PIP scholarship and drops it from any other', async () => {
    await useCase.execute('u1', {
      scholarships: [
        { ...SCHOLARSHIP, categoryId: 'category-kip', kipNumber: ' KIP123 ' },
        { ...SCHOLARSHIP, kipNumber: 'KIP999' },
      ],
    })

    expect(
      (saved().scholarships as { kipNumber: string | null }[]).map(
        (row) => row.kipNumber,
      ),
    ).toEqual(['KIP123', null])
  })

  it('refuses a KIP/PIP scholarship without its KIP number', async () => {
    await expect(
      useCase.execute('u1', {
        scholarships: [{ ...SCHOLARSHIP, categoryId: 'category-kip' }],
      }),
    ).rejects.toThrow('No. KIP wajib diisi untuk beasiswa KIP/PIP')
  })

  it('leaves the rows untouched when the payload carries none', async () => {
    await useCase.execute('u1', { nickname: 'Bud' })

    expect(saved().achievements).toBeUndefined()
    expect(saved().scholarships).toBeUndefined()
  })

  it.each([
    ['competitionFieldId', 'Bidang lomba', 'achievements', ACHIEVEMENT],
    ['competitionLevelId', 'Tingkat lomba', 'achievements', ACHIEVEMENT],
    ['categoryId', 'Kategori beasiswa', 'scholarships', SCHOLARSHIP],
    [
      'providerTypeId',
      'Jenis instansi pemberi beasiswa',
      'scholarships',
      SCHOLARSHIP,
    ],
  ])('refuses an unknown %s on a row', async (field, label, key, row) => {
    await expect(
      useCase.execute('u1', { [key]: [{ ...row, [field]: 'nope' }] }),
    ).rejects.toThrow(
      new BadRequestException(
        `Pilihan tidak dikenal atau tidak aktif: ${label}`,
      ),
    )
  })

  it('accepts an inactive option a saved row already holds, even after the rows move', async () => {
    options.set('old-field', { id: 'old-field', name: 'Lama', isActive: false })
    application.achievements = [
      { ...ACHIEVEMENT, competitionFieldId: 'old-field' },
    ]

    await useCase.execute('u1', {
      achievements: [
        ACHIEVEMENT,
        { ...ACHIEVEMENT, competitionFieldId: 'old-field' },
      ],
    })

    expect(saved().achievements).toHaveLength(2)
  })

  it('refuses a file that does not belong to this application', async () => {
    countApplicationFiles.mockResolvedValue(0)

    await expect(
      useCase.execute('u1', {
        achievements: [{ ...ACHIEVEMENT, fileId: 'file-of-someone-else' }],
      }),
    ).rejects.toThrow(new BadRequestException('Lampiran tidak ditemukan'))
    expect(countApplicationFiles).toHaveBeenCalledWith('app1', [
      'file-of-someone-else',
    ])
    expect(updateMyApplication).not.toHaveBeenCalled()
  })

  it('checks each distinct file once across achievements and scholarships', async () => {
    await useCase.execute('u1', {
      achievements: [{ ...ACHIEVEMENT, fileId: 'f1' }],
      scholarships: [
        { ...SCHOLARSHIP, fileId: 'f1' },
        { ...SCHOLARSHIP, fileId: 'f2' },
      ],
    })

    expect(countApplicationFiles).toHaveBeenCalledWith('app1', ['f1', 'f2'])
  })

  it('skips the file check when no row carries a file', async () => {
    await useCase.execute('u1', { achievements: [ACHIEVEMENT] })

    expect(countApplicationFiles).not.toHaveBeenCalled()
  })

  it('hands the new student address to parents that share it when the payload carries no parents', async () => {
    await useCase.execute('u1', {
      street: 'Jl. Mawar',
      rt: '01',
      rw: '02',
      postalCode: '40911',
      ...CODES,
    })

    expect(saved().parents).toBeUndefined()
    expect(saved().sharedAddress).toMatchObject({
      street: 'Jl. Mawar',
      rt: '01',
      rw: '02',
      postalCode: '40911',
      ...CODES,
      ...NAMES,
    })
  })

  it('leaves parents alone when the student address is not touched and no parents are sent', async () => {
    await useCase.execute('u1', { nickname: 'Bud' })

    expect(saved().sharedAddress).toBeUndefined()
  })

  it('does not send a shared address when the payload carries the parents itself', async () => {
    await useCase.execute('u1', {
      street: 'Jl. Mawar',
      parents: [{ relation: ParentRelation.FATHER, name: 'Budi' }],
    })

    expect(saved().sharedAddress).toBeUndefined()
  })

  it('looks each option list up once per save, however many rows choose from it', async () => {
    await useCase.execute('u1', {
      transportationId: 'active-ojek',
      parents: [
        { relation: 'FATHER', name: 'Ahmad', incomeRangeId: 'income-1' },
        { relation: 'MOTHER', name: 'Siti', incomeRangeId: 'income-1' },
      ] as never,
      achievements: [
        {
          year: 2025,
          competitionName: 'OSN',
          competitionFieldId: 'field-1',
          competitionLevelId: 'level-1',
        },
        {
          year: 2024,
          competitionName: 'MTQ',
          competitionFieldId: 'field-1',
          competitionLevelId: 'level-1',
        },
      ] as never,
    })

    const keys = optionsByIds.mock.calls.map(([key]) => key as string)
    expect(keys.sort()).toEqual([
      'competitionFields',
      'competitionLevels',
      'incomeRanges',
      'transportations',
    ])
  })

  it('keeps the typed region names of an older draft when the picker is still empty', async () => {
    Object.assign(application, {
      village: 'Cikedokan',
      district: 'Bayongbong',
      city: 'Garut',
      province: 'Jawa Barat',
    })

    await useCase.execute('u1', {
      street: 'Jl. Pesantren 1',
      provinceCode: '',
      regencyCode: '',
      districtCode: '',
      villageCode: '',
    })

    const data = saved().data
    expect(data.street).toBe('Jl. Pesantren 1')
    for (const field of [
      'village',
      'district',
      'city',
      'province',
      'provinceCode',
      'regencyCode',
      'districtCode',
      'villageCode',
    ]) {
      expect(data).not.toHaveProperty(field)
    }
  })
})
