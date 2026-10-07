import { planSend } from './send-plan.policy.js'

const types = [
  { id: 'kk', name: 'Kartu Keluarga', isRequired: true },
  { id: 'akta', name: 'Akta Kelahiran', isRequired: true },
  { id: 'surat', name: 'Surat Prestasi', isRequired: false },
]

const decided = (
  documentTypeId: string,
  status: string,
  note: string | null = null,
) => ({
  documentTypeId,
  status,
  note,
})

describe('planSend', () => {
  it('approves when every required document is approved', () => {
    expect(
      planSend(types, [decided('kk', 'APPROVED'), decided('akta', 'APPROVED')]),
    ).toEqual({ kind: 'APPROVED' })
  })

  it('ignores an optional document that is undecided or missing', () => {
    expect(
      planSend(types, [
        decided('kk', 'APPROVED'),
        decided('akta', 'APPROVED'),
        decided('surat', 'PENDING'),
      ]),
    ).toEqual({ kind: 'APPROVED' })
  })

  it('is blocked while a required document is pending or missing', () => {
    expect(planSend(types, [decided('kk', 'APPROVED')])).toEqual({
      kind: 'BLOCKED',
    })
    expect(
      planSend(types, [decided('kk', 'APPROVED'), decided('akta', 'PENDING')]),
    ).toEqual({ kind: 'BLOCKED' })
  })

  it('asks for a revision that lists every rejected document with its reason', () => {
    const plan = planSend(types, [
      decided('kk', 'REJECTED', 'Foto buram'),
      decided('akta', 'REJECTED', 'Bukan akta'),
    ])

    expect(plan).toEqual({
      kind: 'REVISION',
      revisionNote:
        'Berkas yang perlu diunggah ulang:\n- Kartu Keluarga: Foto buram\n- Akta Kelahiran: Bukan akta',
    })
  })

  it('also lists a rejected optional document', () => {
    const plan = planSend(types, [
      decided('kk', 'APPROVED'),
      decided('akta', 'APPROVED'),
      decided('surat', 'REJECTED', 'Tidak terbaca'),
    ])

    expect(plan).toEqual({
      kind: 'REVISION',
      revisionNote:
        'Berkas yang perlu diunggah ulang:\n- Surat Prestasi: Tidak terbaca',
    })
  })

  it('puts the data note after the rejected documents', () => {
    const plan = planSend(
      types,
      [decided('kk', 'REJECTED', 'Buram'), decided('akta', 'APPROVED')],
      'NIK ayah salah',
    )

    expect(plan).toEqual({
      kind: 'REVISION',
      revisionNote:
        'Berkas yang perlu diunggah ulang:\n- Kartu Keluarga: Buram\n\nCatatan data: NIK ayah salah',
    })
  })

  it('lets a data note go out with documents still undecided or missing', () => {
    expect(planSend(types, [], 'Mohon unggah KK dan akta')).toEqual({
      kind: 'REVISION',
      revisionNote: 'Catatan data: Mohon unggah KK dan akta',
    })
  })

  it('treats a blank data note as none', () => {
    expect(planSend(types, [decided('kk', 'APPROVED')], '   ')).toEqual({
      kind: 'BLOCKED',
    })
  })

  it('approves an application that needs no document at all', () => {
    expect(planSend([], [])).toEqual({ kind: 'APPROVED' })
  })
})
