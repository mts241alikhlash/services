import { isSameSection, sectionOf } from './classroom-section.policy.js'

describe('sectionOf', () => {
  it('reads the section off the convention in use', () => {
    expect(sectionOf('VII-A')).toBe('A')
    expect(sectionOf('VIII-B')).toBe('B')
    expect(sectionOf('IX-C')).toBe('C')
  })

  it('reads it through spacing and other separators', () => {
    expect(sectionOf('VIII - B')).toBe('B')
    expect(sectionOf('IX_C')).toBe('C')
    expect(sectionOf('  VII-A  ')).toBe('A')
  })

  it('reads a trailing letter with no separator at all', () => {
    expect(sectionOf('7A')).toBe('A')
    expect(sectionOf('9 C')).toBe('C')
  })

  it('answers in one case, so A and a are the same section', () => {
    expect(sectionOf('VII-a')).toBe('A')
  })

  it('finds no section where there is none', () => {
    expect(sectionOf('VII')).toBeNull()
    expect(sectionOf('')).toBeNull()
    expect(sectionOf(null)).toBeNull()
    expect(sectionOf(undefined)).toBeNull()
  })
})

describe('isSameSection', () => {
  it('pairs a class with its own section a grade up', () => {
    expect(isSameSection('VII-A', 'VIII-A')).toBe(true)
    expect(isSameSection('VII-B', 'VIII-B')).toBe(true)
  })

  it('refuses a different section', () => {
    expect(isSameSection('VII-B', 'VIII-A')).toBe(false)
  })

  it('pairs across spellings, because a section is a section', () => {
    expect(isSameSection('VII-A', 'VIII - a')).toBe(true)
    expect(isSameSection('7A', 'VIII-A')).toBe(true)
  })

  it('does not pair two codes that name no section', () => {
    expect(isSameSection('VII', 'VIII')).toBe(false)
    expect(isSameSection('VII', 'IX')).toBe(false)
  })

  it('refuses when only one side names a section', () => {
    expect(isSameSection('VII-A', 'VIII')).toBe(false)
    expect(isSameSection('VII', 'VIII-A')).toBe(false)
  })
})
