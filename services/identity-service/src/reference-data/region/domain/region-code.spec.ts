import { parseRegions, sortForInsert } from './region-code.js'

describe('parseRegions', () => {
  it('reads the SQL the Kemendagri dataset ships', () => {
    const sql = [
      'INSERT INTO `wilayah` (`kode`, `nama`) VALUES',
      "('32', 'JAWA BARAT'),",
      "('32.04', 'KABUPATEN BANDUNG'),",
      "('32.04.01', 'CILEUNYI'),",
      "('32.04.01.2001', 'CIBIRU WETAN');",
    ].join('\n')

    expect(parseRegions(sql)).toEqual([
      { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
      {
        code: '32.04',
        name: 'KABUPATEN BANDUNG',
        level: 'REGENCY',
        parentCode: '32',
      },
      {
        code: '32.04.01',
        name: 'CILEUNYI',
        level: 'DISTRICT',
        parentCode: '32.04',
      },
      {
        code: '32.04.01.2001',
        name: 'CIBIRU WETAN',
        level: 'VILLAGE',
        parentCode: '32.04.01',
      },
    ])
  })

  it('reads plain code,name lines too', () => {
    expect(parseRegions('32,JAWA BARAT\n32.04,KABUPATEN BANDUNG')).toEqual([
      { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
      {
        code: '32.04',
        name: 'KABUPATEN BANDUNG',
        level: 'REGENCY',
        parentCode: '32',
      },
    ])
  })

  it('unescapes a doubled quote in a name', () => {
    expect(parseRegions("('91', 'PAPUA''S EDGE')")[0].name).toBe("PAPUA'S EDGE")
  })

  it('skips comments and blank lines', () => {
    expect(parseRegions('-- a comment\n\n32,JAWA BARAT')).toHaveLength(1)
  })

  it('ignores a code deeper than a village', () => {
    expect(parseRegions("('32.04.01.2001.9', 'TOO DEEP')")).toEqual([])
  })

  it('keeps the last row when a code repeats', () => {
    const rows = parseRegions("('32', 'OLD NAME')\n('32', 'JAWA BARAT')")
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('JAWA BARAT')
  })

  it('orders parents before children so the foreign key holds', () => {
    const shuffled = parseRegions(
      "('32.04.01.2001', 'CIBIRU WETAN')\n('32', 'JAWA BARAT')\n('32.04', 'KAB BANDUNG')\n('32.04.01', 'CILEUNYI')",
    )
    const codes = sortForInsert(shuffled).map((r) => r.code)

    expect(codes).toEqual(['32', '32.04', '32.04.01', '32.04.01.2001'])
  })
})
